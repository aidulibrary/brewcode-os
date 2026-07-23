var BrewCodeConfig = (function () {
  var isPunycode = location.hostname.includes('xn--');
  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  return {
    playerUrl: isLocal
      ? 'http://localhost:8789'
      : isPunycode
        ? 'https://player.xn--rpr94o750a.xn--fiqs8s'
        : 'https://player.礼字号.中国',
    forgeUrl: isLocal
      ? 'http://localhost:8788'
      : isPunycode
        ? 'https://forge.xn--rpr94o750a.xn--fiqs8s'
        : 'https://forge.礼字号.中国',
    repoUrl: isLocal
      ? 'http://localhost:8787'
      : isPunycode
        ? 'https://repo.xn--rpr94o750a.xn--fiqs8s'
        : 'https://repo.礼字号.中国',
  };
})();
