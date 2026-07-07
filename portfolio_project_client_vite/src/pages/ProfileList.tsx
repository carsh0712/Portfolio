import { useEffect, useRef, useState } from 'react';
import BackLink from '../components/BackLink';
import FormError from '../components/FormError';
import ImagePreviewCard from '../components/ImagePreviewCard';
import PageCard from '../components/PageCard';
import PageState from '../components/PageState';
import ProjectLinkEditor from '../components/ProjectLinkEditor';
import type { Profile, ProfileExtraField, ProfileRequest } from '../types/profile';
import type { ProjectLink } from '../types/project';
import {
  IMAGE_UPLOAD_ACCEPT,
  createProfile,
  deleteProfile,
  fetchFileAsObjectUrl,
  getProfiles,
  isAllowedUploadImage,
  updateProfile,
  uploadImage,
} from '../utils/api';

interface ProfileFormState {
  displayName: string;
  email: string;
  headline: string;
  bio: string;
  avatarFileUuid: string | null;
  extraFields: ProfileExtraField[];
  links: ProjectLink[];
  isDefault: boolean;
}

const emptyForm: ProfileFormState = {
  displayName: '',
  email: '',
  headline: '',
  bio: '',
  avatarFileUuid: null,
  extraFields: [],
  links: [],
  isDefault: false,
};

const extraFieldPresets: Array<Pick<ProfileExtraField, 'key' | 'label' | 'type'>> = [
  { key: 'role', label: '역할', type: 'text' },
  { key: 'location', label: '활동 지역', type: 'text' },
  { key: 'available_for', label: '가능한 작업', type: 'tag' },
  { key: 'tech_focus', label: '관심 기술', type: 'tag' },
];

function toRequest(form: ProfileFormState): ProfileRequest {
  return {
    display_name: form.displayName,
    email: form.email || null,
    headline: form.headline || null,
    bio: form.bio || null,
    avatar_file_uuid: form.avatarFileUuid,
    links: form.links,
    extra_fields: form.extraFields,
    is_default: form.isDefault,
  };
}

function fromProfile(profile: Profile): ProfileFormState {
  return {
    displayName: profile.display_name,
    email: profile.email ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    avatarFileUuid: profile.avatar_file_uuid ?? null,
    extraFields: profile.extra_fields ?? [],
    links: profile.links ?? [],
    isDefault: profile.is_default,
  };
}

function ProfileAvatar({ fileUuid, alt }: { fileUuid: string; alt: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    fetchFileAsObjectUrl(fileUuid, 'thumbnail')
      .then((url) => {
        revoke = url;
        setObjectUrl(url);
      })
      .catch(() => setImageError(true));

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [fileUuid]);

  if (!objectUrl || imageError) {
    return <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0" aria-hidden="true" />;
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
      onError={() => setImageError(true)}
    />
  );
}

export default function ProfileList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProfiles();
      setProfiles(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setUploadError(null);
  };

  const updateField = <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedUploadImage(file)) {
      setUploadError('JPG, PNG, WebP 이미지만 업로드할 수 있습니다. GIF는 지원하지 않습니다.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file);
      updateField('avatarFileUuid', result.uuid);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '아바타 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    updateField('links', [...form.links, { name: '', url: '' }]);
  };

  const handleAddExtraField = () => {
    const nextOrder = form.extraFields.length + 1;
    updateField('extraFields', [
      ...form.extraFields,
      {
        key: `field_${nextOrder}`,
        label: '',
        value: '',
        type: 'text',
        is_public: true,
        order: nextOrder,
      },
    ]);
  };

  const handleAddPresetExtraField = (
    preset: Pick<ProfileExtraField, 'key' | 'label' | 'type'>
  ) => {
    const suffix = form.extraFields.some((field) => field.key === preset.key)
      ? `_${form.extraFields.length + 1}`
      : '';
    updateField('extraFields', [
      ...form.extraFields,
      {
        ...preset,
        key: `${preset.key}${suffix}`,
        value: '',
        is_public: true,
        order: form.extraFields.length + 1,
      },
    ]);
  };

  const handleRemoveExtraField = (index: number) => {
    updateField(
      'extraFields',
      form.extraFields.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleChangeExtraField = <K extends keyof ProfileExtraField>(
    index: number,
    field: K,
    value: ProfileExtraField[K]
  ) => {
    updateField(
      'extraFields',
      form.extraFields.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveLink = (index: number) => {
    updateField(
      'links',
      form.links.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleChangeLink = (index: number, field: keyof ProjectLink, value: string) => {
    updateField(
      'links',
      form.links.map((link, itemIndex) =>
        itemIndex === index ? { ...link, [field]: value } : link
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId === null) {
        await createProfile(toRequest(form));
      } else {
        await updateProfile(editingId, toRequest(form));
      }
      resetForm();
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setForm(fromProfile(profile));
    setUploadError(null);
  };

  const handleDelete = async (profile: Profile) => {
    if (!window.confirm(`${profile.display_name} 프로필을 삭제하시겠습니까?`)) return;

    setError(null);
    try {
      await deleteProfile(profile.id);
      if (editingId === profile.id) resetForm();
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return <PageState loading message="프로필을 불러오는 중..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <BackLink to="/home" label="홈으로 돌아가기" />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6">
        <PageCard>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">프로필 관리</h1>
          <FormError message={error} />

          <div className="space-y-4">
            {profiles.length === 0 ? (
              <p className="text-gray-600">아직 만든 프로필이 없습니다.</p>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="min-w-0 flex gap-3">
                    {profile.avatar_file_uuid ? (
                      <ProfileAvatar
                        fileUuid={profile.avatar_file_uuid}
                        alt={`${profile.display_name} 아바타`}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                          {profile.display_name}
                        </h2>
                        {profile.is_default && (
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                            기본
                          </span>
                        )}
                        {profile.links.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            링크 {profile.links.length}개
                          </span>
                        )}
                      </div>
                      {profile.headline && (
                        <p className="text-sm text-gray-600 mt-1">{profile.headline}</p>
                      )}
                      {profile.email && (
                        <p className="text-sm text-blue-600 mt-1">{profile.email}</p>
                      )}
                      {profile.bio && (
                        <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      )}
                      {profile.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {profile.links.map((link, index) => (
                            <span
                              key={`${link.name}-${index}`}
                              className="text-xs px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full"
                            >
                              {link.name || link.url}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(profile)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(profile)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PageCard>

        <PageCard>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId === null ? '새 프로필' : '프로필 수정'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="displayName">
                표시 이름 *
              </label>
              <input
                id="displayName"
                type="text"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                e-mail
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="headline">
                한 줄 소개
              </label>
              <input
                id="headline"
                type="text"
                value={form.headline}
                onChange={(event) => updateField('headline', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bio">
                소개
              </label>
              <textarea
                id="bio"
                rows={5}
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아바타</label>
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
                    accept={IMAGE_UPLOAD_ACCEPT}
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  {form.avatarFileUuid && (
                    <span className="text-sm text-green-600 truncate">업로드 완료</span>
                  )}
                </div>
                {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                {form.avatarFileUuid && (
                  <ImagePreviewCard
                    fileUuid={form.avatarFileUuid}
                    alt="프로필 아바타 미리보기"
                    onRemove={() => updateField('avatarFileUuid', null)}
                  />
                )}
              </div>
            </div>

            <div className="-mx-2">
              <section className="mb-8 px-2">
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">유동 항목</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        역할, 활동 지역, 가능한 작업처럼 프로필마다 달라지는 정보를 추가합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExtraField}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      직접 추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {extraFieldPresets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleAddPresetExtraField(preset)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full hover:border-blue-300 hover:text-blue-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {form.extraFields.map((field, index) => (
                    <div key={`extra-field-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">항목 #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraField(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">키 *</label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(event) => handleChangeExtraField(index, 'key', event.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">라벨 *</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(event) => handleChangeExtraField(index, 'label', event.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                          <select
                            value={field.type}
                            onChange={(event) => handleChangeExtraField(index, 'type', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="text">텍스트</option>
                            <option value="tag">태그</option>
                            <option value="url">URL</option>
                            <option value="number">숫자</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">순서</label>
                          <input
                            type="number"
                            value={field.order}
                            onChange={(event) => handleChangeExtraField(index, 'order', Number(event.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">값</label>
                        <textarea
                          rows={3}
                          value={field.value}
                          onChange={(event) => handleChangeExtraField(index, 'value', event.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                        <input
                          type="checkbox"
                          checked={field.is_public}
                          onChange={(event) => handleChangeExtraField(index, 'is_public', event.target.checked)}
                          className="w-4 h-4"
                        />
                        공개 프로필에 표시
                      </label>
                    </div>
                  ))}
                  {form.extraFields.length === 0 && (
                    <p className="text-sm text-gray-500">역할, 활동 지역, 가능한 작업처럼 프로필마다 달라지는 항목을 추가할 수 있습니다.</p>
                  )}
                </div>
              </section>

              <ProjectLinkEditor
                links={form.links}
                onAdd={handleAddLink}
                onRemove={handleRemoveLink}
                onChange={handleChangeLink}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => updateField('isDefault', event.target.checked)}
                className="w-4 h-4"
              />
              기본 프로필로 사용
            </label>
            <div className="flex justify-end gap-2">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </PageCard>
      </div>
    </div>
  );
}
