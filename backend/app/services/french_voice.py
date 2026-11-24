import json
import re
import unicodedata
from dataclasses import dataclass

from app.services.wfp_prices import published_french_reply

NO_VALIDATED = "Je ne dispose pas actuellement d'un prix validé."
CLARIFY_MARKET = "Précisez le marché : Natitingou ou Savalou."
CLARIFY_PRODUCT = "Précisez le produit : le maïs ou le riz."
UNCOVERED = (
    "Je ne dispose pas encore des prix pour ce marché. "
    "Je peux vous renseigner sur Natitingou et Savalou."
)
UNSUPPORTED = (
    "Je ne consulte pas ce produit. Je peux vous renseigner sur le maïs et le riz."
)
NOT_UNDERSTOOD = "Je n'ai pas bien compris. Pouvez-vous répéter ?"
RECOGNITION_UNAVAILABLE = (
    "La reconnaissance vocale en français n'est pas disponible pour le moment."
)

_PRODUCTS = {"maize", "rice"}
_MARKETS = {"natitingou", "savalou"}
_AMOUNT = re.compile(r"\d")
_MONEY = re.compile(r"fcfa|xof", re.IGNORECASE)


@dataclass(frozen=True)
class FrenchUnderstanding:
    product: str | None = None
    market: str | None = None
    out_of_scope_product: bool = False
    out_of_scope_market: bool = False
    understood: bool = False

    @property
    def decided(self) -> bool:
        return (
            self.out_of_scope_product
            or self.out_of_scope_market
            or self.product is not None
            or self.market is not None
        )


class FrenchLanguageModel:
    def understand(self, text: str) -> FrenchUnderstanding:
        raise NotImplementedError


def understand_french(
    text: str,
    model: FrenchLanguageModel | None = None,
) -> FrenchUnderstanding:
    detected = detect_french_request(text)
    if detected.decided or model is None:
        return detected
    try:
        guessed = sanitize_understanding(model.understand(text))
    except Exception:
        return detected
    if detected.out_of_scope_product or detected.out_of_scope_market:
        return detected
    product = detected.product or guessed.product
    market = detected.market or guessed.market
    return FrenchUnderstanding(
        product=product,
        market=market,
        understood=bool(product or market or guessed.understood),
    )


def reply_for(understanding: FrenchUnderstanding) -> tuple[str, str]:
    if understanding.out_of_scope_product:
        return "unsupported_product", UNSUPPORTED
    if understanding.out_of_scope_market:
        return "uncovered_market", UNCOVERED
    if understanding.product is None and understanding.market is None:
        return "not_understood", NOT_UNDERSTOOD
    if understanding.product is None:
        return "clarification", CLARIFY_PRODUCT
    if understanding.market is None:
        return "clarification", CLARIFY_MARKET
    try:
        published = published_french_reply(
            understanding.product,
            understanding.market,
        )
    except OSError:
        published = None
    if published:
        return "published_price", published
    return "no_validated_price", NO_VALIDATED


def answer_french_text(
    text: str,
    model: FrenchLanguageModel | None = None,
) -> dict[str, str | None]:
    understanding = understand_french(text, model)
    status, reply = reply_for(understanding)
    return _payload(text, status, reply, understanding)


def recognize_unavailable(transcript: str = "") -> dict[str, str | None]:
    return _payload(
        transcript,
        "recognition_unavailable",
        RECOGNITION_UNAVAILABLE,
        FrenchUnderstanding(),
    )


def detect_french_request(text: str) -> FrenchUnderstanding:
    tokens = set(_fold(text).split())
    out_product = bool(tokens & {"soja", "soya", "sorgho", "mil"})
    out_market = "parakou" in tokens or "cotonou" in tokens
    product = None
    if "riz" in tokens and not out_product:
        product = "rice"
    elif "mais" in tokens and "prix" in tokens and "riz" not in tokens:
        product = "maize"
    market = None
    if "natitingou" in tokens:
        market = "natitingou"
    elif "savalou" in tokens:
        market = "savalou"
    understood = bool(product or market or out_product or out_market)
    return FrenchUnderstanding(
        product=None if out_product else product,
        market=None if out_market else market,
        out_of_scope_product=out_product,
        out_of_scope_market=out_market and market is None,
        understood=understood,
    )


def sanitize_understanding(understanding: FrenchUnderstanding) -> FrenchUnderstanding:
    product = understanding.product if understanding.product in _PRODUCTS else None
    market = understanding.market if understanding.market in _MARKETS else None
    return FrenchUnderstanding(
        product=product,
        market=market,
        out_of_scope_product=understanding.out_of_scope_product,
        out_of_scope_market=understanding.out_of_scope_market,
        understood=understanding.understood or bool(product or market),
    )


def parse_model_json(raw: str) -> FrenchUnderstanding:
    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match is None:
        return FrenchUnderstanding()
    try:
        payload = json.loads(match.group(0))
    except json.JSONDecodeError:
        return FrenchUnderstanding()
    if not isinstance(payload, dict):
        return FrenchUnderstanding()
    product = payload.get("product")
    market = payload.get("market")
    return sanitize_understanding(
        FrenchUnderstanding(
            product=product if isinstance(product, str) else None,
            market=market if isinstance(market, str) else None,
            understood=payload.get("understood") is True,
        )
    )


def reply_contains_invented_amount(reply: str) -> bool:
    return _AMOUNT.search(reply) is not None and _MONEY.search(reply) is not None


class JsonLanguageModel(FrenchLanguageModel):
    def __init__(self, generate):
        self._generate = generate

    def understand(self, text: str) -> FrenchUnderstanding:
        prompt = (
            "Tu extrais une demande de prix agricole.\n"
            "Réponds uniquement avec un objet JSON : "
            '{"product":"maize|rice|null","market":"natitingou|savalou|null","understood":true|false}.\n'
            "N'écris aucun prix, aucun montant, aucune devise.\n"
            f"Demande : {text}"
        )
        return parse_model_json(str(self._generate(prompt)))


def qwen_generate(prompt: str) -> str:
    generator = _qwen_pipeline()
    generated = generator(
        prompt,
        max_new_tokens=60,
        do_sample=False,
        return_full_text=False,
    )
    return str(generated[0]["generated_text"])


def _qwen_pipeline():
    global _QWEN
    if _QWEN is None:
        from transformers import pipeline

        _QWEN = pipeline(
            "text-generation",
            model="Qwen/Qwen2.5-0.5B-Instruct",
            device_map="cpu",
        )
    return _QWEN


_QWEN = None


def _fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower().replace("œ", "oe"))
    letters = "".join(
        character for character in decomposed if unicodedata.category(character) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", " ", letters).strip()


def _payload(
    transcript: str,
    status: str,
    reply: str,
    understanding: FrenchUnderstanding,
) -> dict[str, str | None]:
    if status != "published_price" and reply_contains_invented_amount(reply):
        status = "no_validated_price"
        reply = NO_VALIDATED
    return {
        "status": status,
        "transcript": transcript.strip(),
        "reply": reply,
        "product": understanding.product,
        "market": understanding.market,
    }
