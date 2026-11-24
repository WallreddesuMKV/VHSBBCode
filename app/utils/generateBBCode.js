export function generateMovieBBCode(form, links = []) {
  const title = form.title || 'Movie Title';
  const headerImg = form.headerImg || '';
  const quote = form.quote || '';
  const imgboxUrl = form.imgboxUrl || '';
  const buildName = form.buildName || title;
  const year = form.releaseDate || '';
  const genre = form.genre || '';
  const languages = form.languages === 'Single' ? '' : (form.languages || '');
  const source = form.sourceCrack || '';
  const imdbUrl = form.imdbUrl || '';

  let b = '';
  b += '[center][size=175][b][color=#8040FF]' + title + '[/color][/b][/size]\r\n\r\n';
  if (headerImg) b += '[img]' + headerImg + '[/img]\r\n';
  if (quote) b += '[size=105][quote]' + quote + '[/quote][/size]\r\n';
  if (imgboxUrl) b += '\r\n[img]' + imgboxUrl + '[/img]\r\n';
  b += '\r\n\r\n[size=145][b][color=#8040FF][u]\u2727 Release Info \u2727[/u][/color][/b][/size]\r\n\r\n';
  b += '[size=105][b]Based On: [/b]' + buildName + '\r\n';
  b += '[b]Year: [/b]' + year + '\r\n';
  b += '[b]Genre: [/b]' + genre + '\r\n';
  b += '[b]Languages: [/b]' + languages + '\r\n';
  b += '[b]Source: [/b]' + source + '\r\n\r\n';
  b += '[b]File Size: [/b]' + (form.repackSize || '') + '\r\n';
  b += '[b]Resolution: [/b]' + (form.resolution || '') + '\r\n';
  b += '[b]Color: [/b]' + (form.color || '') + '\r\n';
  b += '[b]Frame rate: [/b]' + (form.frameRate || '') + '\r\n';
  b += '[b]Duration: [/b]' + (form.duration || '') + '\r\n\r\n';
  if (imdbUrl) b += '\r\n[b]Imdb: [/b][url=' + imdbUrl + ']' + imdbUrl + '[/url]\r\n';
  b += '\r\n\r\n[color=#BF0000][b]100% Lossless & MD5 Perfect: all files are identical to originals after installation[/b][/color]\r\n\r\n[/size]\r\n\r\n\r\n';
  b += '[size=145][b][color=#8040FF]Download Links[/color][/b][/size]\r\n\r\n';

  links.filter(l => l.text.trim() || l.url.trim()).forEach(link => {
    const text = link.text.trim();
    const url = link.url.trim();
    b += '[size=105][url=' + (url || '#') + '][color=#FFFFFF]' + (text || url || 'Link') + '[/color][/url][/size]\r\n';
  });

  b += '\r\n\r\n';

  if (form.noteEnabled && form.noteText?.trim()) {
    const cleanNote = form.noteText.trim().replace(/\r?\n/g, '\r\n');
    b += '[size=110][note]' + cleanNote;
    if (form.noteLinkUrl?.trim()) b += ' [url=' + form.noteLinkUrl.trim() + '](note)[/url]';
    b += '[/note][/size]\r\n\r\n\r\n';
  }

  b += '[b][color=#8040FF]IF YOU LIKE THIS MOVIE PLEASE SUPPORT THE DEVELOPERS & BUY IT![/color][/b]\r\n[/center]';
  return b;
}

export function generateGameBBCode(form, links = [], source = 'steam') {
  const title = form.title || 'Game Title';
  const headerImg = form.headerImg || '';
  const quote = form.quote || '';
  const imgboxUrl = form.imgboxUrl || '';
  const releaseDate = form.releaseDate || '';
  const genre = form.genre || '';
  const developer = form.developer || '';
  const publisher = form.publisher || '';
  const buildId = form.buildId || '';
  const buildName = form.buildName || title;
  const languages = form.languages || 'Single';
  const sourceCrack = form.sourceCrack || '';
  const version = form.version || '';
  const repackSize = form.repackSize || 'N/A';
  const finalSize = form.finalSize || 'N/A';
  const ramRequired = form.ramRequired || 'N/A';
  const storeUrl = form.storeUrl || '';

  const isSteam = source === 'steam';
  let basedOnLine = '';
  if (isSteam) {
    basedOnLine = '[b]Based On: [/b]' + buildName + (buildId ? ' (Build ' + buildId + ' )' : ' ( - )');
  } else if (version) {
    basedOnLine = '[b]Based On: [/b]' + buildName + ' (Version ' + version + ' )';
  } else {
    basedOnLine = '[b]Based On: [/b]' + buildName + ' ( - )';
  }

  let b = '';
  b += '[center][size=175][b][color=#8040FF]' + title + '[/color][/b][/size]\r\n\r\n';
  if (headerImg) b += '[img]' + headerImg + '[/img]\r\n';
  if (quote) b += '[size=105][quote]' + quote + '[/quote][/size]\r\n';
  if (imgboxUrl) b += '\r\n[img]' + imgboxUrl + '[/img]\r\n\r\n\r\n';
  else b += '\r\n\r\n';

  b += '[size=145][b][color=#8040FF][u]\u2727 Game Info \u2727[/u][/color][/b][/size]\r\n\r\n';
  b += '[size=105]';
  b += basedOnLine + '\r\n';
  b += '[b]Release Date: [/b]' + releaseDate + '\r\n';
  b += '[b]Genre: [/b]' + genre + '\r\n';
  b += '[b]Developer:[/b] ' + developer + '\r\n';
  b += '[b]Publisher:[/b] ' + publisher + '\r\n';
  b += '[b]Languages: [/b]' + languages + '\r\n';
  b += '[b]Source/Crack: [/b]' + sourceCrack + '\r\n';

  b += '\r\n[size=145][b][color=#8040FF][u]\u2727 Repack Info \u2727[/u][/color][/b][/size]\r\n\r\n';
  b += '[b]Repack Size: [/b]' + repackSize + '\r\n';
  b += '[b]Final Size: [/b]' + finalSize + '\r\n';
  b += '[b]RAM Required: [/b]' + ramRequired + '\r\n';

  if (storeUrl) {
    b += '\r\n\r\n[b]Store: [/b][url=' + storeUrl + ']' + storeUrl + '[/url]\r\n';
  }

  const includedContent = form.includedContent ? form.includedContent.trim() : '';
  if (includedContent) {
    const lines = includedContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const formattedLines = lines.join('\r\n');
    if (formattedLines) {
      b += '\r\n\r\n[size=145][b][color=#8040FF][u]\u2727 Included Content \u2727[/u][/color][/b][/size]\r\n\r\n';
      b += '[size=105][size=95]' + formattedLines + '[/size][/size]\r\n\r\n\r\n';
    }
  }

  b += '\r\n[color=#BF0000][b]100% Lossless & MD5 Perfect: all files are identical to originals after installation[/b][/color]\r\n\r\n[/size]\r\n\r\n\r\n';

  b += '[size=145][b][color=#8040FF]Download Links[/color][/b][/size]\r\n\r\n';
  links.filter(l => l.text.trim() || l.url.trim()).forEach(link => {
    const text = link.text.trim();
    const url = link.url.trim();
    if (url) {
      b += '[size=105][url=' + url + '][color=#FFFFFF]' + (text || url) + '[/color][/url][/size]\r\n';
    } else {
      b += '[size=105][url][color=#FFFFFF]' + (text || 'Link') + '[/color][/url][/size]\r\n';
    }
  });

  b += '\r\n\r\n';

  if (form.noteEnabled) {
    const noteText = form.noteText ? form.noteText.trim() : '';
    const noteLinkUrl = form.noteLinkUrl ? form.noteLinkUrl.trim() : '';
    if (noteText) {
      const cleanNote = noteText.replace(/\r?\n/g, '\r\n');
      b += '[size=110][note]';
      if (noteLinkUrl) b += cleanNote + ' [url=' + noteLinkUrl + '](note)[/url][/note][/size]\r\n\r\n\r\n';
      else b += cleanNote + '[/note][/size]\r\n\r\n\r\n';
    }
  }

  b += '[b][color=#8040FF]IF YOU LIKE THIS GAME PLEASE SUPPORT THE DEVELOPERS & BUY IT![/color][/b]\r\n';
  b += '[/center]';
  return b;
}
