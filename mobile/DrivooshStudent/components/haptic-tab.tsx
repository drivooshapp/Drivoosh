// import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
// import { PlatformPressable } from '@react-navigation/elements';
// import * as Haptics from 'expo-haptics';

// export function HapticTab(props: BottomTabBarButtonProps) {
//   return (
//     <PlatformPressable
//       {...props}
//       onPressIn={(ev) => {
//         if (process.env.EXPO_OS === 'ios') {
//           // Add a soft haptic feedback when pressing down on the tabs.
//           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//         }
//         props.onPressIn?.(ev);
//       }}
//     />
//   );
// }

import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable } from 'react-native';

export function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.(e);
      }}
      onPressIn={(e) => {
        props.onPressIn?.(e);
      }}
    />
  );
}