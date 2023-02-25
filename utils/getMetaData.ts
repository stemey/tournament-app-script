namespace Module {
  export function getMetaData(sheet, key) {
    const metaData = sheet
      .getDeveloperMetadata()
      .find((d) => d.getKey() === key);
    return metaData ? metaData.getValue() : undefined;
  }
}
