import { install } from 'esinstall';

await install(['lit', 'lit-toast/lit-toast.js', 'lit/directives/until.js'], {
  dest: 'dist/web_modules',
});
