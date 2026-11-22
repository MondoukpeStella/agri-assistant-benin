import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';

export function SproutMark() {
  return (
    <View style={styles.logo}>
      <Image
        accessible={false}
        resizeMode="contain"
        source={require('../../assets/logo.png')}
        style={styles.logoImage}
      />
    </View>
  );
}

export function ArrowIcon({ color = colors.surface }) {
  return (
    <View style={styles.arrowWrap}>
      <View style={[styles.arrowShaft, { backgroundColor: color }]} />
      <View style={[styles.arrowHead, { borderColor: color }]} />
    </View>
  );
}

export function MicIcon({ color = colors.surface }) {
  return (
    <View style={styles.mic}>
      <View style={[styles.micHead, { backgroundColor: color }]} />
      <View style={[styles.micArc, { borderColor: color }]} />
      <View style={[styles.micStem, { backgroundColor: color }]} />
    </View>
  );
}

export function GearIcon({ color = colors.surface }) {
  return (
    <View style={styles.gear}>
      {[0, 45, 90, 135].map((angle) => (
        <View
          key={angle}
          style={[
            styles.gearTooth,
            {
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      ))}
      <View style={[styles.gearRing, { borderColor: color }]} />
      <View style={styles.gearHub} />
    </View>
  );
}

export function SpeakerIcon({ color = colors.primary }) {
  return (
    <View style={styles.speaker}>
      <View style={[styles.speakerBody, { backgroundColor: color }]} />
      <View style={[styles.speakerCone, { borderLeftColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  logoImage: {
    height: 64,
    width: 64,
  },
  arrowWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 16,
    width: 16,
  },
  arrowShaft: {
    height: 2,
    width: 12,
  },
  arrowHead: {
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 8,
    marginLeft: -6,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },
  mic: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'flex-start',
    width: 16,
  },
  micHead: {
    borderRadius: 4,
    height: 12,
    width: 8,
  },
  micArc: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 0,
    borderWidth: 2,
    height: 8,
    marginTop: -4,
    width: 14,
  },
  micStem: {
    height: 4,
    width: 2,
  },
  gear: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  gearTooth: {
    borderRadius: 1,
    height: 4,
    left: 0,
    position: 'absolute',
    top: 7,
    width: 18,
  },
  gearRing: {
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  gearHub: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: 6,
    left: 6,
    position: 'absolute',
    top: 6,
    width: 6,
  },
  speaker: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 16,
    width: 16,
  },
  speakerBody: {
    borderRadius: 1,
    height: 8,
    width: 4,
  },
  speakerCone: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 5,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderTopWidth: 5,
    height: 0,
    width: 0,
  },
});
