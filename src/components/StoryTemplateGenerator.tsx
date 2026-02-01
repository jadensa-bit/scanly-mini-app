'use client';

import { useState } from 'react';
import { Download, Instagram, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoryTemplateGeneratorProps {
  handle: string;
  brandName: string;
}

const TEMPLATES = [
  { id: 'gradient', name: 'Gradient', emoji: '🌈' },
  { id: 'minimal', name: 'Minimal', emoji: '⚪' },
  { id: 'dark', name: 'Dark Mode', emoji: '🌙' },
];

export default function StoryTemplateGenerator({ handle, brandName }: StoryTemplateGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('gradient');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTemplate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/story-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          template: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (data.success && data.dataUrl) {
        setPreviewUrl(data.dataUrl);
      } else {
        alert(data.error || 'Failed to generate template');
      }
    } catch (error) {
      console.error('Template generation error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTemplate = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${handle}-instagram-story.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="w-6 h-6 text-pink-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Instagram Story Generator
        </h3>
        <Sparkles className="w-5 h-5 text-yellow-500" />
      </div>

      <p className="text-gray-600 mb-6">
        Create a shareable story graphic with your piqo QR code
      </p>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Template
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${
                  selectedTemplate === template.id
                    ? 'border-pink-600 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-3xl mb-2">{template.emoji}</div>
              <div className="text-sm font-medium text-gray-900">
                {template.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateTemplate}
        disabled={isGenerating}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Story
          </>
        )}
      </button>

      {/* Preview */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-100 rounded-xl p-4 aspect-[9/16] flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt="Story preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <button
            onClick={downloadTemplate}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Story
          </button>

          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Upload to Instagram Stories and tag us @piqo!
          </p>
        </motion.div>
      )}
    </div>
  );
}
