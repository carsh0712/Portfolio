import { useRef, useState } from 'react';
import { uploadImage } from '../utils/api';
import ImagePreviewCard from './ImagePreviewCard';
import Toast from './Toast';

export interface PortfolioFormData {
  name: string;
  code: string;
  description: string;
  screenshotFileUuid: string | null;
  isPublic: boolean;
  order?: number;
}

interface PortfolioFormProps {
  formData: PortfolioFormData;
  onChange: (data: PortfolioFormData) => void;
  showOrder?: boolean;
}

export default function PortfolioForm({ formData, onChange, showOrder }: PortfolioFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('?대?吏 ?뚯씪留??낅줈?쒗븷 ???덉뒿?덈떎.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file);
      onChange({ ...formData, screenshotFileUuid: result.uuid });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '?대?吏 ?낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {uploadError && (
        <Toast message={uploadError} type="error" onClose={() => setUploadError(null)} />
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          ?ы듃?대━???대쫫 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="예: 내가 만든 앱"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          ?ы듃?대━??肄붾뱶 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="?? my-apps, web-projects"
          pattern="[a-z0-9-]+"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          ?곷Ц ?뚮Ц?? ?レ옄, ?섏씠??-)留??ъ슜?????덉뒿?덈떎.
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          ?ㅻ챸 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          placeholder="?ы듃?대━?ㅼ뿉 ???媛꾨떒???ㅻ챸???낅젰?섏꽭??"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">?대?吏 (?좏깮)</label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '업로드 중...' : '이미지 업로드'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {formData.screenshotFileUuid && (
              <span className="text-sm text-green-600 truncate max-w-xs">?낅줈???꾨즺</span>
            )}
          </div>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

          {formData.screenshotFileUuid && (
            <ImagePreviewCard
              fileUuid={formData.screenshotFileUuid}
              alt="?ы듃?대━???대?吏 誘몃━蹂닿린"
              onRemove={() => {
                onChange({ ...formData, screenshotFileUuid: null });
              }}
            />
          )}
        </div>
      </div>

      {showOrder && (
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
            ?뺣젹 ?쒖꽌
          </label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order ?? 0}
            onChange={(e) => onChange({ ...formData, order: Number(e.target.value) })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          checked={formData.isPublic}
          onChange={(e) => onChange({ ...formData, isPublic: e.target.checked })}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
          怨듦컻 ?ы듃?대━?ㅻ줈 ?ㅼ젙
        </label>
        <span className="text-xs text-gray-500">
          ({formData.isPublic ? '?ㅻⅨ ?ъ슜?먭? 蹂????덉뒿?덈떎' : '?섎쭔 蹂????덉뒿?덈떎'})
        </span>
      </div>
    </>
  );
}

