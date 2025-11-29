import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Play, FileText } from 'lucide-react';

interface TestPlanViewerProps {
    sessionId: string;
}

interface TestCase {
    test_id: string;
    name: string;
    description: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    type: 'API' | 'UI' | 'Integration';
    steps: string[];
    expected_result: string;
    test_data?: Record<string, any>;
    dependencies?: string[];
    estimated_time: string;
}

interface TestSuite {
    suite_name: string;
    description: string;
    test_cases: TestCase[];
}

interface TestPlan {
    test_suites: TestSuite[];
    coverage_summary: {
        total_test_cases: number;
        critical_tests: number;
        high_priority_tests: number;
        medium_priority_tests: number;
        low_priority_tests: number;
        api_tests: number;
        ui_tests: number;
        integration_tests: number;
    };
    test_execution_plan: {
        smoke_tests: string[];
        regression_tests: string[];
        estimated_total_time: string;
    };
}

const TestPlanViewer: React.FC<TestPlanViewerProps> = ({ sessionId }) => {
    const [testPlan, setTestPlan] = useState<TestPlan | null>(null);
    const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
    const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTestPlan();
    }, [sessionId]);

    const loadTestPlan = async () => {
        try {
            const response = await fetch(`http://localhost:8050/projects/${sessionId}/e2e_test_plan`);
            if (response.ok) {
                const data = await response.json();
                setTestPlan(data.data);
            }
        } catch (error) {
            console.error('Failed to load test plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSuite = (suiteName: string) => {
        const newExpanded = new Set(expandedSuites);
        if (newExpanded.has(suiteName)) {
            newExpanded.delete(suiteName);
        } else {
            newExpanded.add(suiteName);
        }
        setExpandedSuites(newExpanded);
    };

    const toggleTest = (testId: string) => {
        const newExpanded = new Set(expandedTests);
        if (newExpanded.has(testId)) {
            newExpanded.delete(testId);
        } else {
            newExpanded.add(testId);
        }
        setExpandedTests(newExpanded);
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-800';
            case 'High':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300 dark:border-orange-800';
            case 'Medium':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-800';
            case 'Low':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'API':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
            case 'UI':
                return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'Integration':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Clock className="animate-spin mr-2" size={20} />
                <span>Loading test plan...</span>
            </div>
        );
    }

    if (!testPlan) {
        return (
            <div className="p-8 text-center">
                <div className="mb-4 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No E2E test plan available yet.</p>
                    <p className="text-sm mt-2">Complete all development tasks first, then generate the test plan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Coverage Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {testPlan.coverage_summary.total_test_cases}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Tests</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {testPlan.coverage_summary.critical_tests}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {testPlan.coverage_summary.high_priority_tests}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">High Priority</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {testPlan.test_execution_plan.estimated_total_time}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Est. Time</div>
                </div>
            </div>

            {/* Test Type Distribution */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {testPlan.coverage_summary.api_tests}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">API Tests</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {testPlan.coverage_summary.ui_tests}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">UI Tests</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {testPlan.coverage_summary.integration_tests}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Integration Tests</div>
                </div>
            </div>

            {/* Test Suites */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Test Suites</h3>
                {testPlan.test_suites.map((suite) => {
                    const isExpanded = expandedSuites.has(suite.suite_name);

                    return (
                        <div
                            key={suite.suite_name}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-[hsl(var(--card))] overflow-hidden"
                        >
                            {/* Suite Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => toggleSuite(suite.suite_name)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <button className="mt-1">
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base">{suite.suite_name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {suite.description}
                                            </p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {suite.test_cases.length} test{suite.test_cases.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Cases (Expanded) */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20">
                                    <div className="p-4 space-y-2">
                                        {suite.test_cases.map((testCase) => {
                                            const isTestExpanded = expandedTests.has(testCase.test_id);

                                            return (
                                                <div
                                                    key={testCase.test_id}
                                                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                                                >
                                                    {/* Test Case Header */}
                                                    <div
                                                        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => toggleTest(testCase.test_id)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-2 flex-1">
                                                                <button className="mt-0.5">
                                                                    {isTestExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                </button>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono text-xs text-gray-500">
                                                                            {testCase.test_id}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(testCase.priority)}`}>
                                                                            {testCase.priority}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(testCase.type)}`}>
                                                                            {testCase.type}
                                                                        </span>
                                                                    </div>
                                                                    <div className="font-medium text-sm">{testCase.name}</div>
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        {testCase.description}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500 ml-2">
                                                                ⏱️ {testCase.estimated_time}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Test Case Details (Expanded) */}
                                                    {isTestExpanded && (
                                                        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                                                            {/* Steps */}
                                                            <div className="mb-3">
                                                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                                    Test Steps:
                                                                </h5>
                                                                <ol className="list-decimal list-inside space-y-1">
                                                                    {testCase.steps.map((step, idx) => (
                                                                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                            {step}
                                                                        </li>
                                                                    ))}
                                                                </ol>
                                                            </div>

                                                            {/* Expected Result */}
                                                            <div className="mb-3">
                                                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                                    Expected Result:
                                                                </h5>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {testCase.expected_result}
                                                                </p>
                                                            </div>

                                                            {/* Test Data */}
                                                            {testCase.test_data && Object.keys(testCase.test_data).length > 0 && (
                                                                <div className="mb-3">
                                                                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                                        Test Data:
                                                                    </h5>
                                                                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                                                        {JSON.stringify(testCase.test_data, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            {/* Dependencies */}
                                                            {testCase.dependencies && testCase.dependencies.length > 0 && (
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                                        Dependencies:
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {testCase.dependencies.map((dep) => (
                                                                            <span
                                                                                key={dep}
                                                                                className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono"
                                                                            >
                                                                                {dep}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Execution Plan */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-[hsl(var(--card))] p-4">
                <h3 className="text-lg font-semibold mb-3">Test Execution Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Smoke Tests ({testPlan.test_execution_plan.smoke_tests.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {testPlan.test_execution_plan.smoke_tests.map((testId) => (
                                <span
                                    key={testId}
                                    className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-mono"
                                >
                                    {testId}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Regression Tests ({testPlan.test_execution_plan.regression_tests.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {testPlan.test_execution_plan.regression_tests.map((testId) => (
                                <span
                                    key={testId}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-mono"
                                >
                                    {testId}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestPlanViewer;
