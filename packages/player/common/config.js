var BrewCodeConfig = {
  playerUrl:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8789'
      : 'https://player.礼字号.中国',
  forgeUrl:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8788'
      : 'https://forge.礼字号.中国',
  repoUrl:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8787'
      : 'https://repo.礼字号.中国',
};
