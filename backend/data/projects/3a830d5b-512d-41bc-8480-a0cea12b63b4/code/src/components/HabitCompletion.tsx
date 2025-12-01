import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HabitCompletionProps {
  isCompleted: boolean;
  onToggleComplete: () => void;
  streak: number;
  themeColor?: string;
}

const HabitCompletion: React.FC<HabitCompletionProps> = ({
  isCompleted,
  onToggleComplete,
  streak,
  themeColor = 'emerald.500',
}) => {
  const { colors } = useTheme();
  const [animationValue] = React.useState(new Animated.Value(0));

  const buttonAnimation = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (isCompleted) {
      // Animate to completion state
      buttonAnimation.current = Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
      buttonAnimation.current.start();
    } else {
      // Animate back to initial state
      animationValue.setValue(0);
    }
    return () => {
      buttonAnimation.current?.stop();
    };
  }, [isCompleted, animationValue]);

  const iconScale = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const iconOpacity = animationValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const textColor = isCompleted ? colors.emerald[500] : colors.gray[700];
  const backgroundColor = isCompleted ? colors.emerald[100] : colors.gray[50];

  return (
    <TouchableOpacity
      onPress={onToggleComplete}
      style={[styles.container, { backgroundColor }]} 
      activeOpacity={0.7}
    >
      <View style={styles.contentWrapper}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ scale: iconScale }],
              opacity: iconOpacity,
              backgroundColor: colors.emerald[500],
            },
          ]}
        >
          <Icon name="check-bold" size={24} color={colors.white} />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={[styles.streakText, { color: textColor }]}>{streak} Day Streak</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80, // Ensure consistent height
    width: '100%',
    overflow: 'hidden', // To clip the animation
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'absolute', // Position absolutely to allow overlap
    left: 16, // Center it horizontally
  },
  textContainer: {
    flex: 1,
    marginLeft: 70, // Space for the icon wrapper, adjust as needed
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HabitCompletion;
