
import React, { useState } from 'react';
import { X, Download, Wand2, Loader2 } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../utils/translations';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onEditImage: (prompt: string) => Promise<void>;
  title?: string;
  language: AppLanguage;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onEditImage,
  title,
  language 
}) => {
  const t = getTranslation(language);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageUrl}`;
    link.download = `inkflow_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    await onEditImage(editPrompt);
    setIsEditing(false);
    setEditPrompt('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Image Area */}
        <div className="flex-1 bg-ink-950 flex items-center justify-center p-4 relative overflow-auto">
          <img 
            src={`data:image/png;base64,${imageUrl}`} 
            alt="Preview" 
            className="max-w-full max-h-[80vh] object-contain shadow-lg"
          />
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-80 bg-white border-l border-ink-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-ink-100 flex items-center justify-between">
            <h3 className="font-bold text-ink-800 truncate pr-2">{title || t.common.edit}</h3>
            <button onClick={onClose} className="p-1 hover:bg-ink-100 rounded-full text-ink-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            <button 
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-ink-100 text-ink-800 py-3 rounded-lg font-medium hover:bg-ink-200 transition-colors"
            >
              <Download size={18} /> {t.common.download}
            </button>

            <div className="border-t border-ink-100 pt-6">
              <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <Wand2 size={12} /> {t.common.edit} / 重绘
              </label>
              <textarea 
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full bg-ink-50 border border-ink-200 rounded-lg p-3 text-sm focus:outline-none focus:border-accent-500 resize-none h-32 mb-3"
                placeholder={t.preview.editPromptPlaceholder}
              />
              <button 
                onClick={handleEdit}
                disabled={isEditing || !editPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-accent-600 text-white py-3 rounded-lg font-bold hover:bg-accent-700 transition-colors disabled:opacity-50"
              >
                {isEditing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                {isEditing ? t.preview.applying : t.common.confirm}
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-ink-50 text-xs text-ink-400 text-center border-t border-ink-100">
             Gemini 2.5 Flash Image
          </div>
        </div>
      </div>
    </div>
  );
};
