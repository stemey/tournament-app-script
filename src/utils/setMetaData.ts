export function setMetaData(sheet, key,value) {
  const metaData = sheet.getDeveloperMetadata().find((d) => d.getKey() === key);
  if (metaData) {
    metaData.setValue(value);
  }
  sheet.addDeveloperMetadata(key,value)
}
