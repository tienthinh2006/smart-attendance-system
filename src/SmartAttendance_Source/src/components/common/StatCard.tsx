import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  iconText?: string;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = COLORS.primary,
  iconText,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Dải màu accent bên trái tách biệt, đảm bảo bo góc và viền hiển thị hoàn hảo trên Android */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: color,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          },
        ]}
      />

      <View style={styles.cardInner}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {iconText ? (
            <View style={[styles.iconBadge, { backgroundColor: `${color}18` }]}>
              <Text style={[styles.iconText, { color }]}>{iconText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.contentBody}>
          <Text
            style={[styles.value, { color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {value}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 12,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  cardInner: {
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingVertical: 12,
    minHeight: 114,
    justifyContent: 'space-between',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 32,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 15,
    marginRight: 6,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
  },
  contentBody: {
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    color: COLORS.slate400,
    lineHeight: 14,
  },
});


