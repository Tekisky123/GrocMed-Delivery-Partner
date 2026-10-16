import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api/authApi';
import {
    ArrowLeft,
    KeyRound,
    ShieldCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    MessageSquare,
    AlertTriangle,
    Phone,
    Mail,
    ChevronRight,
} from 'lucide-react-native';

export default function DeliveryPartnerForgotPassword() {
    const { showToast } = useToast();

    // 1: Phone -> 2: WhatsApp OTP -> 3: New Password
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verification state
    const [maskedPhone, setMaskedPhone] = useState('');
    const [verifiedPhone, setVerifiedPhone] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [attemptsLeft, setAttemptsLeft] = useState(2);
    const [sendCount, setSendCount] = useState(0);
    const [isLimitReached, setIsLimitReached] = useState(false);

    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (timer > 0) {
            timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timer]);

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 10) {
            setPhone(cleaned);
        }
    };

    // Step 1: Send OTP to WhatsApp
    const handleSendOtp = async () => {
        if (phone.length !== 10) {
            showToast('Please enter a valid 10-digit registered phone number', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.sendForgotPasswordOtp(phone);
            if (res.success) {
                showToast(res.message || 'OTP sent to your WhatsApp', 'success');
                setMaskedPhone(res.maskedPhone || phone);
                setVerifiedPhone(res.phone || phone);
                setSendCount(res.sendCount || 1);
                setAttemptsLeft(res.attemptsLeft !== undefined ? res.attemptsLeft : 1);
                setIsLimitReached(res.attemptsLeft === 0);
                setTimer(60);
                setOtp('');
                setStep(2);
            } else {
                showToast(res.message, 'error');
                if (res.message?.includes('Maximum OTP limit reached')) {
                    setIsLimitReached(true);
                    setAttemptsLeft(0);
                }
            }
        } catch (err: any) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP (Max 2 times)
    const handleResendOtp = async () => {
        if (timer > 0 || attemptsLeft <= 0 || isLimitReached) return;

        setLoading(true);
        try {
            const res = await authApi.sendForgotPasswordOtp(verifiedPhone || phone);
            if (res.success) {
                showToast('New OTP sent to your WhatsApp', 'success');
                setSendCount(res.sendCount || 2);
                setAttemptsLeft(res.attemptsLeft !== undefined ? res.attemptsLeft : 0);
                setIsLimitReached(res.attemptsLeft === 0);
                setTimer(60);
                setOtp('');
            } else {
                showToast(res.message, 'error');
                if (res.message?.includes('Maximum OTP limit reached')) {
                    setIsLimitReached(true);
                    setAttemptsLeft(0);
                }
            }
        } catch (err: any) {
            showToast('Failed to resend OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async () => {
        const cleanOtp = otp.trim();
        if (cleanOtp.length !== 6) {
            showToast('Please enter the complete 6-digit WhatsApp OTP code', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.verifyForgotPasswordOtp(verifiedPhone, cleanOtp);
            if (res.success && res.resetToken) {
                showToast('OTP verified successfully!', 'success');
                setResetToken(res.resetToken);
                setStep(3);
            } else {
                showToast(res.message || 'Invalid or expired OTP', 'error');
            }
        } catch (err: any) {
            showToast('Verification failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.resetPasswordWithToken(verifiedPhone, resetToken, newPassword);
            if (res.success) {
                showToast('Password reset successfully! Please login.', 'success');
                setTimeout(() => {
                    router.replace('/login');
                }, 800);
            } else {
                showToast(res.message || 'Failed to update password', 'error');
            }
        } catch (err: any) {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderAdminContactDetails = () => (
        <View className="bg-red-50 border border-red-200 rounded-3xl p-5 mb-6 shadow-sm">
            <View className="flex-row items-start mb-4">
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <AlertTriangle size={22} color="#DC2626" />
                </View>
                <View className="flex-1">
                    <Text className="text-red-900 font-extrabold text-base">Maximum OTP limit reached</Text>
                    <Text className="text-red-700 text-xs font-semibold mt-0.5 leading-relaxed">
                        Please contact administrator for password change.
                    </Text>
                </View>
            </View>

            <View className="bg-white rounded-2xl p-3 border border-red-100 space-y-2">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Administrator Contact Details
                </Text>

                <TouchableOpacity
                    onPress={() => Linking.openURL('tel:9381078548')}
                    className="flex-row items-center p-2.5 bg-gray-50 rounded-xl"
                    activeOpacity={0.7}
                >
                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Phone size={16} color="#1D4ED8" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-500 text-[10px] font-semibold">Phone Call</Text>
                        <Text className="text-gray-900 font-bold text-xs">+91 9381078548</Text>
                    </View>
                    <Text className="text-blue-600 text-xs font-bold bg-blue-50 px-2.5 py-1 rounded-md">Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL('https://wa.me/919381078548?text=Hello%20GrocMed%20Admin,%20I%20have%20reached%20the%20maximum%20OTP%20limit%20for%20password%20reset.%20Please%20help%20me%20update%20my%20password.')}
                    className="flex-row items-center p-2.5 bg-gray-50 rounded-xl"
                    activeOpacity={0.7}
                >
                    <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                        <MessageSquare size={16} color="#15803D" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-500 text-[10px] font-semibold">WhatsApp Support</Text>
                        <Text className="text-gray-900 font-bold text-xs">+91 9381078548</Text>
                    </View>
                    <Text className="text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-md">WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL('mailto:Info@grocmed.com?subject=Delivery%20Partner%20Password%20Reset%20Assistance')}
                    className="flex-row items-center p-2.5 bg-gray-50 rounded-xl"
                    activeOpacity={0.7}
                >
                    <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
                        <Mail size={16} color="#7E22CE" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-500 text-[10px] font-semibold">Email Administrator</Text>
                        <Text className="text-gray-900 font-bold text-xs">Info@grocmed.com</Text>
                    </View>
                    <Text className="text-purple-600 text-xs font-bold bg-purple-50 px-2.5 py-1 rounded-md">Email</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 px-8 py-12 justify-center">
                    
                    {/* Back Header */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Partner Password Reset</Text>
                    </View>

                    {/* Step Dots */}
                    <View className="flex-row items-center justify-center mb-8">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <Text className={`font-bold text-sm ${step >= 1 ? 'text-white' : 'text-gray-600'}`}>1</Text>
                        </View>
                        <View className={`w-10 h-1 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'} mx-2`} />
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <Text className={`font-bold text-sm ${step >= 2 ? 'text-white' : 'text-gray-600'}`}>2</Text>
                        </View>
                        <View className={`w-10 h-1 ${step >= 3 ? 'bg-orange-500' : 'bg-gray-200'} mx-2`} />
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 3 ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <Text className={`font-bold text-sm ${step >= 3 ? 'text-white' : 'text-gray-600'}`}>3</Text>
                        </View>
                    </View>

                    {/* ================= STEP 1: Phone Entry ================= */}
                    {step === 1 && (
                        <View className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <View className="w-16 h-16 bg-orange-100 rounded-2xl items-center justify-center self-center mb-4">
                                <KeyRound size={32} color="#F97316" />
                            </View>

                            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Forgot Password?</Text>
                            <Text className="text-gray-500 text-sm text-center mb-6">
                                Enter your registered 10-digit mobile number. We will send a 6-digit OTP code directly to your WhatsApp.
                            </Text>

                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Registered Phone Number</Text>
                                <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3">
                                    <Text className="text-gray-500 font-bold mr-2">+91</Text>
                                    <TextInput
                                        className="flex-1 text-gray-900 font-medium text-base"
                                        placeholder="10-digit phone number"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="number-pad"
                                        value={phone}
                                        onChangeText={handlePhoneChange}
                                        maxLength={10}
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <View className="flex-row items-center bg-orange-50 p-3 rounded-xl mb-4">
                                <ShieldCheck size={18} color="#EA580C" />
                                <Text className="text-orange-900 text-xs ml-2 flex-1">
                                    OTP will be delivered via secure WhatsApp message. (Max 2 requests).
                                </Text>
                            </View>

                            {/* Administrator Contact Details if Limit Reached */}
                            {isLimitReached && renderAdminContactDetails()}

                            <TouchableOpacity
                                onPress={handleSendOtp}
                                disabled={loading || phone.length !== 10 || isLimitReached}
                                className={`bg-orange-500 rounded-2xl py-4 items-center shadow-lg shadow-orange-500/30 ${
                                    loading || phone.length !== 10 || isLimitReached ? 'opacity-70' : ''
                                }`}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Send WhatsApp OTP</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ================= STEP 2: WhatsApp OTP Verification ================= */}
                    {step === 2 && (
                        <View className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <View className="w-16 h-16 bg-green-100 rounded-2xl items-center justify-center self-center mb-4">
                                <MessageSquare size={32} color="#16A34A" />
                            </View>

                            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">WhatsApp OTP</Text>
                            
                            {/* Required explicit WhatsApp notice */}
                            <View className="bg-green-50 border border-green-200/80 rounded-2xl p-4 items-center mb-6">
                                <Text className="text-green-800 text-xs text-center leading-relaxed">
                                    We have sent an OTP to your registered WhatsApp number:
                                </Text>
                                <Text className="text-gray-900 font-black text-base mt-1 tracking-wider">
                                    +91 {verifiedPhone || maskedPhone}
                                </Text>
                            </View>

                            {/* Single 6-Digit OTP Input Box */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Enter 6-Digit OTP</Text>
                                <TextInput
                                    className="h-16 bg-white border border-gray-300 rounded-2xl text-center text-3xl font-extrabold text-gray-900 tracking-widest px-4"
                                    placeholder="------"
                                    placeholderTextColor="#9CA3AF"
                                    value={otp}
                                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                    editable={!loading}
                                />
                                <Text className="text-gray-400 text-xs text-center mt-2">
                                    Enter the 6-digit OTP code received on your WhatsApp
                                </Text>
                            </View>

                            {/* Resend & Rate Limit Status */}
                            <View className="flex-row items-center justify-between mb-4">
                                {attemptsLeft > 0 ? (
                                    <TouchableOpacity
                                        onPress={handleResendOtp}
                                        disabled={timer > 0 || loading}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-sm font-semibold ${timer > 0 ? 'text-gray-400' : 'text-orange-600'}`}>
                                            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend WhatsApp OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text className="text-xs text-red-500 font-bold">Max attempts (2/2) reached</Text>
                                )}

                                <View className="bg-gray-200 px-2.5 py-1 rounded-md">
                                    <Text className="text-xs font-semibold text-gray-700">Attempt {sendCount}/2</Text>
                                </View>
                            </View>

                            {/* Administrator Contact Details if Limit Reached */}
                            {(attemptsLeft <= 0 || isLimitReached) && renderAdminContactDetails()}

                            <TouchableOpacity
                                onPress={handleVerifyOtp}
                                disabled={loading || otp.trim().length !== 6}
                                className={`bg-orange-500 rounded-2xl py-4 items-center shadow-lg shadow-orange-500/30 ${
                                    loading || otp.trim().length !== 6 ? 'opacity-70' : ''
                                }`}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Verify OTP</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                className="mt-4 items-center"
                                disabled={loading}
                            >
                                <Text className="text-gray-500 font-semibold text-sm">Change Phone Number</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ================= STEP 3: Create New Password ================= */}
                    {step === 3 && (
                        <View className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <View className="w-16 h-16 bg-green-100 rounded-2xl items-center justify-center self-center mb-4">
                                <CheckCircle2 size={32} color="#16A34A" />
                            </View>

                            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Set New Password</Text>
                            <Text className="text-gray-500 text-sm text-center mb-6">
                                Identity verified! Create a new password for your delivery partner account.
                            </Text>

                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">New Password *</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-gray-900"
                                        placeholder="Min 6 characters"
                                        placeholderTextColor="#9CA3AF"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-3.5"
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={22} color="#9CA3AF" /> : <Eye size={22} color="#9CA3AF" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className="text-gray-700 font-semibold mb-2">Confirm Password *</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-gray-900"
                                        placeholder="Re-enter password"
                                        placeholderTextColor="#9CA3AF"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-3.5"
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={22} color="#9CA3AF" /> : <Eye size={22} color="#9CA3AF" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleResetPassword}
                                disabled={loading}
                                className={`bg-orange-500 rounded-2xl py-4 items-center shadow-lg shadow-orange-500/30 ${
                                    loading ? 'opacity-70' : ''
                                }`}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">Update Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
