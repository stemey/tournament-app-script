namespace Module {
  export function hasMetaData(sheet, key, value) {
    return getMetaData(sheet, key) === value;
  }
}
