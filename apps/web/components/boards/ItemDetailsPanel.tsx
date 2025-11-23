/**
 * Item Details Panel
 * Slide-out panel for viewing and editing item details, updates, and sub-items
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Info, ListChecks, Paperclip, Clock, Plus, Trash2, Upload, Download } from 'lucide-react';
import { useItem, useUpdateItem, useUpdateColumnValues } from '@/hooks/useItems';
import { useSubitems, useCreateSubitem, useUpdateSubitem, useDeleteSubitem, useToggleSubitemCompletion } from '@/hooks/useSubitems';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/useAttachments';
import { useActivity } from '@/hooks/useActivity';
import type { Column } from '@/types/boards';
import { TableCell } from '@/components/views/TableCell';

interface ItemDetailsPanelProps {
  itemId: string | null;
  boardId: string;
  columns: Column[];
  onClose: () => void;
}

type Tab = 'updates' | 'info' | 'subitems' | 'files' | 'activity';

export function ItemDetailsPanel({ itemId, boardId, columns, onClose }: ItemDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('updates');
  const [itemName, setItemName] = useState('');
  
  const { data, isLoading } = useItem(itemId || '');
  const { data: subitemsData, isLoading: subitemsLoading } = useSubitems(itemId || '');
  const { data: commentsData, isLoading: commentsLoading } = useComments(itemId || '');
  const { data: attachmentsData, isLoading: attachmentsLoading } = useAttachments(itemId || '');
  const { data: activityData, isLoading: activityLoading } = useActivity(itemId || '');
  
  const updateItem = useUpdateItem();
  const updateColumnValues = useUpdateColumnValues();
  const createSubitem = useCreateSubitem();
  const updateSubitem = useUpdateSubitem();
  const deleteSubitem = useDeleteSubitem();
  const toggleSubitemCompletion = useToggleSubitemCompletion();
  const createComment = useCreateComment();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  
  const item = data?.item;
  const subitems = subitemsData?.subitems || [];
  const comments = commentsData?.comments || [];
  const attachments = attachmentsData?.attachments || [];
  const activities = activityData?.activities || [];
  
  const [newSubitemName, setNewSubitemName] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setItemName(item.name);
    }
  }, [item]);

  const handleNameBlur = () => {
    if (itemId && itemName !== item?.name) {
      updateItem.mutate({ itemId, data: { name: itemName } });
    }
  };

  const handleColumnUpdate = (columnId: string, value: unknown) => {
    if (!itemId) return;
    
    updateColumnValues.mutate({
      itemId,
      values: [{
        column_id: columnId,
        value,
        text_value: typeof value === 'string' ? value : undefined,
        numeric_value: typeof value === 'number' ? value : undefined,
      }],
    });
  };

  const handleAddSubitem = async () => {
    if (!itemId || !newSubitemName.trim()) return;
    
    try {
      await createSubitem.mutateAsync({
        item_id: itemId,
        name: newSubitemName.trim(),
      });
      setNewSubitemName('');
    } catch (error) {
      console.error('Failed to create subitem:', error);
    }
  };

  const handleToggleSubitem = (subitemId: string) => {
    toggleSubitemCompletion.mutate(subitemId);
  };

  const handleDeleteSubitem = (subitemId: string) => {
    if (confirm('Are you sure you want to delete this sub-item?')) {
      deleteSubitem.mutate(subitemId);
    }
  };

  const handleAddComment = async () => {
    if (!itemId || !newCommentContent.trim()) return;
    
    try {
      await createComment.mutateAsync({
        itemId,
        content: newCommentContent.trim(),
      });
      setNewCommentContent('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !itemId) return;

    try {
      await uploadAttachment.mutateAsync({ itemId, file });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!itemId) return;
    if (confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachment.mutate({ itemId, attachmentId });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatActivityAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      created: 'created',
      updated: 'updated',
      moved: 'moved',
      comment_added: 'added a comment',
      attachment_added: 'added an attachment',
      attachment_deleted: 'deleted an attachment',
    };
    return actionMap[action] || action;
  };

  const getUserDisplayName = (profile: { email: string; full_name?: string | null } | null | undefined): string => {
    if (!profile) return 'System';
    return profile.full_name || profile.email.split('@')[0] || 'Unknown';
  };

  if (!itemId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-[var(--elevated)] shadow-2xl z-50 flex flex-col border-l border-[var(--border-subtle)] animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-start justify-between mb-4">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onBlur={handleNameBlur}
              className="text-2xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Item Name"
            />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 text-sm font-medium text-[var(--text-secondary)]">
            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'updates' 
                  ? 'border-[var(--accent)] text-[var(--accent)]' 
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare size={16} />
              Updates
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'info' 
                  ? 'border-[var(--accent)] text-[var(--accent)]' 
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Info size={16} />
              Info
            </button>
            <button
              onClick={() => setActiveTab('subitems')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'subitems' 
                  ? 'border-[var(--accent)] text-[var(--accent)]' 
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <ListChecks size={16} />
              Sub-items
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'files' 
                  ? 'border-[var(--accent)] text-[var(--accent)]' 
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Paperclip size={16} />
              Files
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'activity' 
                  ? 'border-[var(--accent)] text-[var(--accent)]' 
                  : 'border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              <Clock size={16} />
              Activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">
              Loading...
            </div>
          ) : (
            <>
              {activeTab === 'updates' && (
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <textarea
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAddComment();
                        }
                      }}
                      placeholder="Write an update..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] text-sm resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Press Cmd/Ctrl + Enter to post
                      </span>
                      <button
                        onClick={handleAddComment}
                        disabled={!newCommentContent.trim() || createComment.isPending}
                        className="px-4 py-2 bg-[var(--accent)] text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {createComment.isPending ? 'Posting...' : 'Post Update'}
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {commentsLoading ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                      <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No updates yet. Write one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-4 border border-[var(--border-subtle)] rounded-md bg-[var(--background)]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[var(--accent)]/20 rounded-full flex items-center justify-center text-xs font-medium text-[var(--accent)]">
                                {getUserDisplayName(comment.profiles).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                  {getUserDisplayName(comment.profiles)}
                                </div>
                                <div className="text-xs text-[var(--text-tertiary)]">
                                  {new Date(comment.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                            {comment.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-6">
                  {columns.map((column) => {
                    const columnValue = item?.column_values?.find((cv: any) => cv.column_id === column.id);
                    return (
                      <div key={column.id} className="group">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                          {column.title}
                        </label>
                        <div className="p-2 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] min-h-[38px] flex items-center">
                          <TableCell
                            column={column}
                            value={columnValue?.value}
                            isEditing={true} // Always editable in panel
                            onSave={(value) => handleColumnUpdate(column.id, value)}
                            onCancel={() => {}}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'subitems' && (
                <div className="space-y-4">
                  {/* Add Subitem */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubitemName}
                      onChange={(e) => setNewSubitemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSubitem();
                        }
                      }}
                      placeholder="Add sub-item..."
                      className="flex-1 px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] text-sm"
                    />
                    <button
                      onClick={handleAddSubitem}
                      disabled={!newSubitemName.trim() || createSubitem.isPending}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>

                  {/* Subitems List */}
                  {subitemsLoading ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      Loading sub-items...
                    </div>
                  ) : subitems.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                      <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No sub-items yet. Add one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subitems.map((subitem) => (
                        <div
                          key={subitem.id}
                          className="flex items-center gap-3 p-3 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={subitem.is_completed}
                            onChange={() => handleToggleSubitem(subitem.id)}
                            className="cursor-pointer"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              subitem.is_completed
                                ? 'line-through text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {subitem.name}
                          </span>
                          <button
                            onClick={() => handleDeleteSubitem(subitem.id)}
                            className="p-1 hover:bg-[var(--error)]/10 rounded text-[var(--error)] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                  {/* Upload File */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                    >
                      <Upload size={16} />
                      <span>Upload File</span>
                    </label>
                    {uploadAttachment.isPending && (
                      <p className="text-sm text-[var(--text-tertiary)]">Uploading...</p>
                    )}
                  </div>

                  {/* Attachments List */}
                  {attachmentsLoading ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                      <Paperclip size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No files yet. Upload one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 border border-[var(--border-subtle)] rounded-md bg-[var(--background)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <Paperclip size={16} className="text-[var(--text-secondary)]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {attachment.file_name}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {attachment.url && (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--accent)] transition-colors"
                                title="Download"
                              >
                                <Download size={16} />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="p-1 hover:bg-[var(--error)]/10 rounded text-[var(--error)] transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {activityLoading ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      Loading activity...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-secondary)]">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No activity yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 border border-[var(--border-subtle)] rounded-md bg-[var(--background)]"
                        >
                          <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock size={14} className="text-[var(--text-secondary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)]">
                              <span className="font-medium">
                                {getUserDisplayName(activity.profiles)}
                              </span>
                              {' '}
                              <span className="text-[var(--text-secondary)]">
                                {formatActivityAction(activity.action)}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)] mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
