import { useCloudPlatformStore } from '#/store/cloud-platform';

export function hasOperationalDataRole(
  index: string,
  type: 'HaveFunction' = 'HaveFunction',
) {
  const cloudStore = useCloudPlatformStore();
  const projectConfig = cloudStore.projectConfig;
  const adminType = (
    projectConfig?.ParentInfo as undefined | { AdminType?: number }
  )?.AdminType;

  if (Number(adminType) !== 2) {
    return true;
  }

  const rawField = projectConfig?.RoleDataField;
  if (!rawField) {
    return false;
  }

  try {
    const roleData =
      typeof rawField === 'string'
        ? (JSON.parse(rawField) as Record<string, string>)
        : rawField;
    const value = roleData[type];
    if (!value) {
      return false;
    }
    return String(value).split(',').includes(index);
  } catch {
    return false;
  }
}
