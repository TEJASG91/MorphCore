/** A throwaway grayscale face so M1 renders something before you upload a photo.
 *  Brightness becomes depth via the image provider, so even this reads as 3D. */
export function makeDefaultFace(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;

  x.fillStyle = '#000';
  x.fillRect(0, 0, 256, 256);

  const g = x.createRadialGradient(128, 118, 18, 128, 130, 108);
  g.addColorStop(0, '#d2d2d2');
  g.addColorStop(0.6, '#8a8a8a');
  g.addColorStop(1, '#050505');
  x.fillStyle = g;
  x.beginPath();
  x.ellipse(128, 130, 78, 98, 0, 0, 7);
  x.fill();

  x.fillStyle = '#f2f2f2';
  x.beginPath();
  x.ellipse(100, 118, 11, 7, 0, 0, 7);
  x.fill();
  x.beginPath();
  x.ellipse(156, 118, 11, 7, 0, 0, 7);
  x.fill();

  x.fillStyle = '#1c1c1c';
  x.beginPath();
  x.ellipse(100, 118, 4, 4, 0, 0, 7);
  x.fill();
  x.beginPath();
  x.ellipse(156, 118, 4, 4, 0, 0, 7);
  x.fill();

  x.strokeStyle = '#bdbdbd';
  x.lineWidth = 4;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(86, 102);
  x.quadraticCurveTo(100, 96, 114, 102);
  x.stroke();
  x.beginPath();
  x.moveTo(142, 102);
  x.quadraticCurveTo(156, 96, 170, 102);
  x.stroke();

  x.strokeStyle = '#a8a8a8';
  x.beginPath();
  x.moveTo(128, 124);
  x.lineTo(121, 152);
  x.lineTo(135, 154);
  x.stroke();

  x.strokeStyle = '#e0e0e0';
  x.lineWidth = 5;
  x.beginPath();
  x.arc(128, 172, 26, 0.16 * Math.PI, 0.84 * Math.PI);
  x.stroke();

  return c;
}
