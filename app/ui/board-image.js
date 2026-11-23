function clippedText(context, text, width) {
  if (context.measureText(text).width <= width) return text;
  const characters = Array.from(text);
  while (context.measureText(characters.join('') + '…').width > width) characters.pop();
  return characters.join('') + '…';
}

function drawQuote(context, message, x, y, width, maxLines) {
  const words = ('“' + message + '”').split(/\s+/);
  let line = words.shift();
  for (let row = 0; row < maxLines; row++) {
    while (words.length && context.measureText(line + ' ' + words[0]).width <= width) line += ' ' + words.shift();
    if (row === maxLines - 1 && words.length) line += ' ' + words.join(' ');
    context.fillText(clippedText(context, line, width), x, y + row * 32);
    if (!words.length) break;
    line = words.shift();
  }
}

async function loadPicture(source) {
  if (!source) return null;
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

function drawPicture(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  context.drawImage(image, (image.width - cropWidth) / 2, (image.height - cropHeight) / 2,
    cropWidth, cropHeight, x, y, width, height);
}

const paperColors = ['#fff0c7', '#f4d3d9', '#f7e2b4', '#ebe3ce'];

export async function boardImage({ title, intro, mode, visible, start, activePage, pageCount }) {
  const isStoryboard = mode === 'storyboard';
  const pictures = await Promise.all(visible.map(wish => loadPicture(wish.photo || (isStoryboard && wish.illustration))));
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  context.fillStyle = isStoryboard ? '#f3e7cd' : '#c79566';
  context.fillRect(0, 0, 1080, 1350);
  context.strokeStyle = '#6d2c39';
  context.lineWidth = 3;
  context.strokeRect(28, 28, 1024, 1294);
  context.fillStyle = '#6d2c39';
  context.font = 'bold 25px sans-serif';
  context.fillText(isStoryboard ? 'BIRTHDAY STORYBOARD' : 'THE BIRTHDAY FILE', 66, 92);
  context.fillStyle = '#3d221e';
  context.font = 'bold 60px Georgia, serif';
  context.fillText(title, 66, 161, 948);
  context.font = '25px sans-serif';
  context.fillText(intro, 66, 205, 948);

  const width = visible.length === 1 ? 948 : 462;
  const height = Math.floor((1008 - 24 * (Math.ceil(visible.length / 2) - 1)) / Math.ceil(visible.length / 2));
  visible.forEach((wish, index) => {
    const x = 66 + (index % 2) * 486;
    const y = 244 + Math.floor(index / 2) * (height + 24);
    const picture = pictures[index];
    const illustrated = isStoryboard && !wish.photo && picture;
    context.fillStyle = isStoryboard ? '#fff8e9' : paperColors[index % paperColors.length];
    context.fillRect(x, y, width, height);
    context.strokeStyle = '#a87557';
    context.lineWidth = 1;
    context.strokeRect(x, y, width, height);
    context.fillStyle = '#743b39';
    context.font = 'bold 19px sans-serif';
    context.fillText((isStoryboard ? 'SCENE ' : 'MEMORY ') + (start + index + 1), x + 20, y + 36);
    if (picture) {
      const pictureHeight = Math.min(height - (illustrated ? 183 : 150), Math.round((width - 40) * 0.58));
      drawPicture(context, picture, x + 20, y + 53, width - 40, pictureHeight);
      if (illustrated) {
        context.font = 'italic 26px Georgia, serif';
        drawQuote(context, wish.message, x + 20, y + height - 92, width - 40, 1);
      }
    } else {
      context.fillStyle = '#452725';
      context.font = 'italic 29px Georgia, serif';
      drawQuote(context, wish.message, x + 20, y + 90, width - 40, 4);
    }
    context.fillStyle = '#452725';
    context.font = 'bold 28px sans-serif';
    context.fillText(clippedText(context, wish.caption, width - 40), x + 20, y + height - 58);
    context.fillStyle = '#794d46';
    context.font = '21px sans-serif';
    context.fillText(clippedText(context, 'From ' + wish.sender + (illustrated ? ' · AI illustration' : ''), width - 40),
      x + 20, y + height - 24);
  });
  context.fillStyle = '#6d2c39';
  context.font = 'bold 19px sans-serif';
  context.fillText('Birthday Adda', 66, 1297);
  if (pageCount > 1) {
    context.textAlign = 'right';
    context.fillText('Page ' + (activePage + 1) + ' of ' + pageCount, 1014, 1297);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Couldn’t create the board image.');
  return new File([blob], 'birthday-' + mode + '-' + (activePage + 1) + '.png', { type: 'image/png' });
}
