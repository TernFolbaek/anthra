import React, { useState } from 'react';
import './EditGroupModal.css';
import GroupInfoTab from './GroupInfoTab';
import GroupMembersTab from './GroupMembersTab';

interface EditGroupModalProps {
    groupInfo: {
        groupId: number;
        groupName: string;
        groupDescription: string;
        creatorId: string;
        groupMembersDesired: string;
        isPublic: boolean;
        groupPurpose: string;
    };
    onClose: () => void;
    onGroupUpdated: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
                                                           groupInfo,
                                                           onClose,
                                                           onGroupUpdated,
                                                       }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');

    return (
        <div className="edit-group-modal-overlay">
            <div className="edit-group-modal-content ">
                <button className="edit-group-close-button" onClick={onClose}>
                    &times;
                </button>

                <div className="edit-group-tabs">
                    <button
                        className={`text-sm edit-group-tab ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Info
                    </button>
                    <button
                        className={`text-sm edit-group-tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        Members
                    </button>
                </div>

                {activeTab === 'info' && (
                    <GroupInfoTab
                        groupInfo={groupInfo}
                        onClose={onClose}
                        onGroupUpdated={onGroupUpdated}
                    />
                )}

                {activeTab === 'members' && (
                    <GroupMembersTab
                        groupInfo={{
                            groupId: groupInfo.groupId,
                            groupName: groupInfo.groupName,
                            creatorId: groupInfo.creatorId,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default EditGroupModal;
