import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';


export default function LoadingScreen() {
    const scaleValue = new Animated.Value(1);

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.05,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../../assets/logo.png')}
                style={[styles.logo, { transform: [{ scale: scaleValue }] }]}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    logo: {
        width: 115,
        height: 115,
    },
});