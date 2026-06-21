import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function PaymentsScreen() {
  
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="traffic-cone" size={80} color="#88c0cc" />
      <Text style={styles.subtitle}>העמוד נמצא בתהליך בנייה</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  subtitle: { fontSize: 16, color: '#6e6e6e', marginTop: 8, textAlign: 'center' },
});