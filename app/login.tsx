import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { router } from 'expo-router';
import { Package, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();

    const handlePhoneChange = (text: string) => {
        // Remove non-numeric characters
        const cleaned = text.replace(/[^0-9]/g, '');
        // Limit to 10 digits
        if (cleaned.length <= 10) {
            setPhone(cleaned);
        }
    };

    const handleLogin = async () => {
        if (phone.length !== 10) {
            showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }
        if (!password) {
            showToast('Please enter your password', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await login({ phone, password });
            if (res.success) {
                showToast('Login successful!', 'success');
                router.replace('/(tabs)');
            } else {
                showToast(res.message || 'Invalid credentials', 'error');
            }
        } catch (error) {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 justify-center px-8 py-12">
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-orange-100 rounded-3xl items-center justify-center mb-4">
                            <Package size={40} color="#F97316" />
                        </View>
                        <Text className="text-3xl font-bold text-gray-900">Delivery Partner</Text>
                        <Text className="text-gray-500 mt-2 text-center">Login to your account to start deliveries</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Phone Number</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={10}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Password</Text>
                            <View className="relative">
                                <TextInput
                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 pr-12"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity 
                                    className="absolute right-4 top-4"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={24} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={24} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            className={`bg-orange-500 rounded-2xl py-4 mt-4 items-center shadow-lg shadow-orange-500/30 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="mt-12 items-center">
                        <Text className="text-gray-400 text-xs">GrocMed Delivery Ecosystem</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
