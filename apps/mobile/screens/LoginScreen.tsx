import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  async function signUp() {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (error) Alert.alert('Error', error.message);
      else Alert.alert('Success', 'Check your email for confirmation!');
      setLoading(false);
    }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Legacy Field Command</Text>
      <View style={styles.inputContainer}>
        <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
        />
        <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button title={loading ? "Loading..." : "Sign In"} onPress={signIn} disabled={loading} />
        <View style={{height: 10}} />
        <Button title="Sign Up" onPress={signUp} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 40,
  },
  inputContainer: {
      marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
      marginTop: 10,
  }
});

