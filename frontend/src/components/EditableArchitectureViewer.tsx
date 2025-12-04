import { useState } from 'react';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import ArchitectureViewer from './ArchitectureViewer';

interface EditableArchitectureViewerProps {
    data: any;
    onSave?: (newData: any) => Promise<void>;
    editable?: boolean;
}

const EditableArchitectureViewer: React.FC<EditableArchitectureViewerProps> = ({
    data,
    onSave,
    editable = true
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(JSON.stringify(data, null, 2));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!onSave) return;

        try {
            // Validate JSON
            const parsedData = JSON.parse(editedData);

            setSaving(true);
            setError(null);
            await onSave(parsedData);
            setIsEditing(false);
        } catch (err: any) {
            if (err instanceof SyntaxError) {
                setError('Invalid JSON format. Please check your syntax.');
            } else {
                setError('Failed to save changes. Please try again.');
            }
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedData(JSON.stringify(data, null, 2));
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="space-y-4">
            {editable && onSave && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            {isEditing
                                ? 'Editing architecture configuration. Changes will be saved to your project.'
                                : 'You can edit the architecture, tech stack, and diagrams before generating code.'
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                    disabled={saving}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                    disabled={saving}
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <Edit2 size={16} />
                                Edit Architecture
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {isEditing ? (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">Edit Architecture JSON</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Edit the architecture configuration below. You can modify the tech stack, diagrams (Mermaid code), and other settings.
                            </p>
                        </div>
                        <textarea
                            value={editedData}
                            onChange={(e) => setEditedData(e.target.value)}
                            className="w-full h-[600px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                            placeholder="Enter architecture JSON..."
                        />
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                <strong>💡 Tip:</strong> You can edit tech stack choices, modify Mermaid diagram code,
                                update sequence diagrams, and adjust API design principles. Make sure to maintain valid JSON format.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <ArchitectureViewer data={data} />
            )}
        </div>
    );
};

export default EditableArchitectureViewer;
