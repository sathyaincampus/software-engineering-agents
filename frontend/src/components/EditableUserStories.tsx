import { useState } from 'react';
import { Edit2, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';

interface UserStory {
    id: string;
    title: string;
    description: string;
    priority: string;
}

interface EditableUserStoriesProps {
    userStories: UserStory[];
    onSave?: (newStories: UserStory[]) => Promise<void>;
    editable?: boolean;
}

const EditableUserStories: React.FC<EditableUserStoriesProps> = ({
    userStories,
    onSave,
    editable = true
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedStories, setEditedStories] = useState<UserStory[]>(userStories);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!onSave) return;

        setSaving(true);
        try {
            await onSave(editedStories);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedStories(userStories);
        setIsEditing(false);
    };

    const handleAddStory = () => {
        const newStory: UserStory = {
            id: `US-${editedStories.length + 1}`.padStart(6, '0'),
            title: 'New User Story',
            description: 'Description of the user story',
            priority: 'Medium'
        };
        setEditedStories([...editedStories, newStory]);
    };

    const handleRemoveStory = (index: number) => {
        setEditedStories(editedStories.filter((_, i) => i !== index));
    };

    const handleUpdateStory = (index: number, field: keyof UserStory, value: string) => {
        const updated = [...editedStories];
        updated[index] = { ...updated[index], [field]: value };
        setEditedStories(updated);
    };

    return (
        <div className="space-y-4">
            {editable && onSave && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            {isEditing
                                ? 'Editing user stories. You can add, remove, or modify stories.'
                                : 'You can edit user stories before proceeding to architecture design.'
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
                                Edit User Stories
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isEditing ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Edit User Stories</h3>
                        <button
                            onClick={handleAddStory}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Plus size={16} />
                            Add Story
                        </button>
                    </div>

                    <div className="space-y-3">
                        {editedStories.map((story, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={story.id}
                                                onChange={(e) => handleUpdateStory(index, 'id', e.target.value)}
                                                className="w-32 px-2 py-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                                                placeholder="Story ID"
                                            />
                                            <select
                                                value={story.priority}
                                                onChange={(e) => handleUpdateStory(index, 'priority', e.target.value)}
                                                className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            value={story.title}
                                            onChange={(e) => handleUpdateStory(index, 'title', e.target.value)}
                                            className="w-full px-3 py-2 font-medium bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                                            placeholder="Story title"
                                        />
                                        <textarea
                                            value={story.description}
                                            onChange={(e) => handleUpdateStory(index, 'description', e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-y"
                                            rows={2}
                                            placeholder="Story description"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStory(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remove story"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {userStories?.map((story, i) => (
                        <div key={i} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{story.id}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${story.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                    }`}>{story.priority}</span>
                            </div>
                            <p className="font-medium text-sm">{story.title}</p>
                            {story.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{story.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EditableUserStories;
