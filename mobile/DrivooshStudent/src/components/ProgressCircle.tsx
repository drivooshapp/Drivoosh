import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
    progress: number;
    size?: number;
    strokeWidth?: number;
}

export default function ProgressCircle({
    progress,
    size = 120,
    strokeWidth = 10,
}: Props) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const progressAnim = useSharedValue(0);

    useEffect(() => {
        progressAnim.value = withTiming(progress, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });
    }, [progress]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset:
                circumference - (circumference * progressAnim.value) / 100,
        };
    });

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#eee"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#0194b1"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    animatedProps={animatedProps}
                    rotation={-90}
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>

            <View style={styles.textContainer}>
                <Text style={styles.text}>{Math.round(progress)}%</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>התקדמות</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { justifyContent: 'center', alignItems: 'center', position: 'relative', },
    textContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', },
    text: { fontSize: 26, fontWeight: '600', color: '#0194b1', textAlign: 'center', },
    label: { fontSize: 12, color: '#666', marginTop: -2, textAlign: 'center', }
});