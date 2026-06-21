import { useRef, useState } from 'react';
import { uploadImage } from '../utils/api';
import FormTextField from './FormTextField';
import FormTextarea from './FormTextarea';
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

  const updateField = <K extends keyof PortfolioFormData>(
    field: K,
    value: PortfolioFormData[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file);
      updateField('screenshotFileUuid', result.uuid);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
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

      <FormTextField
        id="name"
        label="포트폴리오 이름"
        value={formData.name}
        onChange={(value) => updateField('name', value)}
        required
        placeholder="예: 내가 만든 앱"
      />

      <FormTextField
        id="code"
        label="포트폴리오 코드"
        value={formData.code}
        onChange={(value) => updateField('code', value)}
        required
        placeholder="예: my-apps, web-projects"
        pattern="[a-z0-9-]+"
        helperText="영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다."
      />

      <FormTextarea
        id="description"
        label="설명"
        value={formData.description}
        onChange={(value) => updateField('description', value)}
        required
        placeholder="포트폴리오에 대한 간단한 설명을 입력하세요."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">이미지 (선택)</label>
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
              <span className="text-sm text-green-600 truncate max-w-xs">업로드 완료</span>
            )}
          </div>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

          {formData.screenshotFileUuid && (
            <ImagePreviewCard
              fileUuid={formData.screenshotFileUuid}
              alt="포트폴리오 이미지 미리보기"
              onRemove={() => updateField('screenshotFileUuid', null)}
            />
          )}
        </div>
      </div>

      {showOrder && (
        <FormTextField
          id="order"
          label="정렬 순서"
          type="number"
          value={formData.order ?? 0}
          onChange={(value) => updateField('order', Number(value))}
          required
        />
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          checked={formData.isPublic}
          onChange={(event) => updateField('isPublic', event.target.checked)}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
          공개 포트폴리오로 설정
        </label>
        <span className="text-xs text-gray-500">
          ({formData.isPublic ? '다른 사용자가 볼 수 있습니다' : '나만 볼 수 있습니다'})
        </span>
      </div>
    </>
  );
}
