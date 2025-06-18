const STORAGE_KEY = {
  pageSizeKey: 'pageSizeKey',
  TABLE_COL_WIDTH_CONFIG: 'TABLE_COL_WIDTH_CONFIG',
  TABLE_HEADER_CONFIG: 'TABLE_HEADER_CONFIG',
  TABLE_HEADER_SORT_CONFIG: 'TABLE_HEADER_SORT_CONFIG',
};

const getConfigSafe = (id, defaultValue, type) => {
  const config = localStorage.getItem(type);
  if (config) {
    const obj = JSON.parse(config);
    const result = obj[id];
    if (result !== undefined) {
      return result;
    }
    return defaultValue;
  }

  return defaultValue;
};

const saveConfigSafe = (id, value, type) => {
  if (id) {
    let config = localStorage.getItem(type);
    if (config) {
      config = JSON.parse(config);
      config[id] = value;
    } else {
      config = {};
      config[id] = value;
    }
    localStorage.setItem(type, JSON.stringify(config));
  }
};

export const getPageSizeSafe = (id, defaultPageSize = 10) => {
  return getConfigSafe(id, defaultPageSize, STORAGE_KEY.pageSizeKey);
};

export const savePageSize = (id, pageSize) => {
  saveConfigSafe(id, pageSize, STORAGE_KEY.pageSizeKey);
};

export const getTableHeaderConfig = (id, defaultConfig) => {
  return getConfigSafe(id, defaultConfig, STORAGE_KEY.TABLE_HEADER_CONFIG);
};

export const setTableHeaderConfig = (id, headerConfig) => {
  saveConfigSafe(id, headerConfig, STORAGE_KEY.TABLE_HEADER_CONFIG);
};

export const getTableColWidthConfig = (id, defaultConfig = {}) => {
  return getConfigSafe(id, defaultConfig, STORAGE_KEY.TABLE_COL_WIDTH_CONFIG);
};

export const setTableColWidthConfig = (id, config) => {
  saveConfigSafe(id, config, STORAGE_KEY.TABLE_COL_WIDTH_CONFIG);
};

export const getTableHeaderSortConfig = (id, defaultConfig) => {
  return getConfigSafe(id, defaultConfig, STORAGE_KEY.TABLE_HEADER_SORT_CONFIG);
};

export const setTableHeaderSortConfig = (id, headerConfig) => {
  saveConfigSafe(id, headerConfig, STORAGE_KEY.TABLE_HEADER_SORT_CONFIG);
};
