import { onMounted, onUnmounted } from 'vue';

const OPEN_OVERLAY_SELECTORS = [
  '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
  '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)',
  '.ant-cascader-dropdown:not(.ant-select-dropdown-hidden)',
  '.ant-tree-select-dropdown:not(.ant-select-dropdown-hidden)',
  '.ant-dropdown:not(.ant-dropdown-hidden)',
  '.ant-mentions-dropdown:not(.ant-mentions-dropdown-hidden)',
];

const SKIP_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'file',
  'radio',
  'reset',
  'submit',
]);

function isDisplayed(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.pointerEvents !== 'none'
  );
}

function getTopmostModalWrap() {
  const wraps = [
    ...document.querySelectorAll<HTMLElement>('.ant-modal-wrap'),
  ].filter((wrap) => {
    if (wrap.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    return isDisplayed(wrap);
  });

  if (wraps.length === 0) {
    return null;
  }

  wraps.sort(
    (a, b) =>
      (Number(window.getComputedStyle(a).zIndex) || 0) -
      (Number(window.getComputedStyle(b).zIndex) || 0),
  );
  return wraps.at(-1) ?? null;
}

function hasOpenOverlay() {
  return OPEN_OVERLAY_SELECTORS.some((selector) => {
    const node = document.querySelector<HTMLElement>(selector);
    return !!(node && isDisplayed(node));
  });
}

function isTextEnterTarget(el: HTMLElement) {
  if (el instanceof HTMLTextAreaElement || el.isContentEditable) {
    return false;
  }
  if (el.closest('.ant-input-textarea, .tox-tinymce, [contenteditable="true"]')) {
    return false;
  }
  if (el instanceof HTMLInputElement) {
    return !SKIP_INPUT_TYPES.has((el.type || 'text').toLowerCase());
  }
  return el.classList.contains('ant-select-selection-search-input');
}

/** 输入框旁边已有「查询添加」等行内按钮时，回车应走原逻辑，不要提交弹窗 */
function hasNearbyInlineAction(el: HTMLElement) {
  if (el.closest('.ant-input-search, .ant-input-group-wrapper')) {
    return true;
  }
  const group = el.closest(
    '.ant-space, .ant-space-compact, .ant-input-group, .ant-input-group-wrapper',
  );
  if (!group || group.closest('.ant-modal-footer')) {
    return false;
  }
  const actionBtn = group.querySelector('button, .ant-btn');
  return !!(actionBtn && !actionBtn.closest('.ant-modal-footer'));
}

function getFooterConfirmButton(wrap: HTMLElement) {
  const footer = wrap.querySelector<HTMLElement>('.ant-modal-footer');
  if (!footer) {
    return null;
  }
  const buttons = [...footer.querySelectorAll('button')];
  const enabledPrimary = buttons.filter((btn) => {
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
      return false;
    }
    if (btn.classList.contains('ant-btn-loading')) {
      return false;
    }
    return btn.classList.contains('ant-btn-primary');
  });
  return enabledPrimary.at(-1) ?? null;
}

function handleModalEnter(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.repeat) {
    return;
  }
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement) || !isTextEnterTarget(target)) {
    return;
  }
  if (hasOpenOverlay()) {
    return;
  }
  if (hasNearbyInlineAction(target)) {
    return;
  }

  const wrap = getTopmostModalWrap();
  if (!wrap || !wrap.contains(target)) {
    return;
  }
  if (
    wrap.classList.contains('skip-enter-submit') ||
    wrap.querySelector('.ant-modal.skip-enter-submit, .skip-enter-submit')
  ) {
    return;
  }

  const confirmButton = getFooterConfirmButton(wrap);
  if (!confirmButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  confirmButton.click();
}

/**
 * 表单弹窗内输入完成后按回车，等同点击底部「确定」。
 * 多行文本、下拉展开、行内「查询添加」等场景会跳过。
 * 个别弹窗可用 wrap-class-name="skip-enter-submit" 关闭。
 */
export function useModalEnterSubmit() {
  onMounted(() => {
    document.addEventListener('keydown', handleModalEnter, true);
  });
  onUnmounted(() => {
    document.removeEventListener('keydown', handleModalEnter, true);
  });
}
