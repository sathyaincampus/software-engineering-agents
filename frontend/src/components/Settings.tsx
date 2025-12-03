import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Save, X, Key, Zap, Clock, AlertCircle } from 'lucide-react';

import { API_BASE_URL } from '../config';

interface ModelSettings {
    provider: string;
    model_name: string;
    api_key: string;
    temperature: number;
    timeout: number;
}

interface AvailableModel {
    id: string;
    name: string;
    description: string;
}

const Settings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<ModelSettings>({
        provider: 'google',
        model_name: 'gemini-2.0-flash-exp',
        api_key: '',
        temperature: 0.7,
        timeout: 120
    });

    const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [showApiKey, setShowApiKey] = useState(false);

    // Load API key from localStorage on mount (encoded for basic obfuscation)
    useEffect(() => {
        const loadStoredApiKey = async () => {
            try {
                const stored = localStorage.getItem('sparktoship_api_key');
                if (stored) {
                    // Decode from base64 (basic obfuscation, not encryption)
                    const decoded = atob(stored);
                    setSettings(prev => ({ ...prev, api_key: decoded }));

                    // Auto-send to backend so user doesn't need to re-enter
                    try {
                        await axios.post(`${API_BASE_URL}/settings`, {
                            provider: settings.provider,
                            model_name: settings.model_name,
                            api_key: decoded,
                            temperature: settings.temperature,
                            timeout: settings.timeout
                        });
                        console.log('✅ API key loaded from storage and sent to backend');
                    } catch (e) {
                        console.error('Failed to send stored API key to backend:', e);
                    }
                }
            } catch (e) {
                console.error('Failed to load stored API key:', e);
            }
        };

        loadStoredApiKey();
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
            setShowApiKey(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (settings.provider) {
            loadAvailableModels(settings.provider);
        }
    }, [settings.provider]);

    const loadSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/settings`);
            setSettings(prev => ({
                ...prev,
                provider: res.data.provider,
                model_name: res.data.model_name,
                temperature: res.data.temperature,
                timeout: res.data.timeout,
                // Keep the API key from localStorage, don't overwrite
            }));
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    };

    const loadAvailableModels = async (provider: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/models/${provider}`);
            setAvailableModels(res.data);
        } catch (e) {
            console.error('Failed to load models:', e);
        }
    };

    const saveSettings = async () => {
        if (!settings.api_key) {
            setSaveStatus('error');
            return;
        }

        setLoading(true);
        setSaveStatus('saving');

        try {
            await axios.post(`${API_BASE_URL}/settings`, settings);

            // Store API key in localStorage (base64 encoded for basic obfuscation)
            try {
                const encoded = btoa(settings.api_key);
                localStorage.setItem('sparktoship_api_key', encoded);
            } catch (e) {
                console.error('Failed to store API key:', e);
            }

            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus('idle');
                onClose();
            }, 1500);
        } catch (e: any) {
            console.error('Failed to save settings:', e);
            setSaveStatus('error');

            // Show detailed error if available
            const errorDetail = e.response?.data?.detail || e.message;
            if (errorDetail) {
                alert(`Failed to save settings: ${errorDetail}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <SettingsIcon className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Model Settings</h2>
                            <p className="text-sm text-gray-500">Configure AI provider and model</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">AI Provider</label>
                        <select
                            value={settings.provider}
                            onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                            className="w-full input-field"
                        >
                            <option value="google">Google (Gemini)</option>
                            <option value="anthropic" disabled>Anthropic (Claude) - Coming Soon</option>
                            <option value="openai" disabled>OpenAI (GPT) - Coming Soon</option>
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Model</label>
                        <select
                            value={settings.model_name}
                            onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                            className="w-full input-field"
                        >
                            {availableModels.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} - {model.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Key size={16} />
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={settings.api_key}
                                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                                placeholder="Enter your API key"
                                className="w-full input-field pr-24"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-600 font-medium"
                            >
                                {showApiKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Get your API key from{' '}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Zap size={16} />
                            Temperature: {settings.temperature}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Precise (0.0)</span>
                            <span>Creative (1.0)</span>
                        </div>
                    </div>

                    {/* Timeout */}
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Clock size={16} />
                            Request Timeout (seconds)
                        </label>
                        <input
                            type="number"
                            min="30"
                            max="300"
                            value={settings.timeout}
                            onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                            className="w-full input-field"
                        />
                    </div>

                    {/* Warning */}
                    {settings.provider !== 'google' && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Note:</strong> Currently, only Google Gemini models are fully supported. Other providers are coming soon.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] p-6 flex items-center justify-between">
                    <div className="text-sm">
                        {saveStatus === 'success' && (
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Settings saved successfully!</span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="text-red-600 dark:text-red-400 font-medium">✗ Please enter a valid API key</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-secondary px-6 py-2.5 rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={loading || !settings.api_key}
                            className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
