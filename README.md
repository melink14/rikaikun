# rikaikun

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users/jipdnfibhldikgcjhfnomkfpcebammhp)
![GitHub](https://img.shields.io/github/license/melink14/rikaikun)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jipdnfibhldikgcjhfnomkfpcebammhp)](https://chrome.google.com/webstore/detail/rikaikun/jipdnfibhldikgcjhfnomkfpcebammhp)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![All Contributors](https://img.shields.io/badge/all_contributors-17-orange.svg?style=flat-square)](#contributors-)

rikaikun allows you to read Japanese web pages by hovering over words you don't know and getting their translations.

## Table of Contents

- [rikaikun](#rikaikun)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
    - [Current Goals](#current-goals)
  - [Install](#install)
    - [Via The Store](#via-the-store)
    - [As an Unpacked Extension](#as-an-unpacked-extension)
  - [Usage](#usage)
    - [Features](#features)
    - [Options](#options)
      - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Maintainers](#maintainers)
  - [Credits](#credits)
  - [Contributing](#contributing)
    - [Contributors ✨](#contributors-)
  - [License](#license)

## Background

rikaikun is a port of [Rikaichan](https://www.polarcloud.com/getrcx/) I started in 2010 when Chrome released its extension API. It was originally hosted on Google Code until Google Code was canceled and everything was migrated to Github.

For those of you that don't know, Rikaichan was a Firefox extension that emulates the popup translations of rikaixul. It's perhaps the best inline translation of Japanese.

I started with the idea that I would make a the chrome equivalent of Rikaichan from scratch using my own ideas. However, after I tried Rikaichan, I realized that it's already quite good and starting from 0 when he already has numerous iterations would be wasting the excellent work done by those developers.

Since then Firefox killed the extension model Rikaichan was based on and many other variants have been created and ported to various browsers. Many of these were created due to a long period where I left rikaikun stagnant. I apologize to the contributors and users who were left stranded. Thanks for everybody who stayed.

### Current Goals

- Refactor code base such that it becomes very easy to maintain and contribute to.
- Fix bugs in dictionary output.
- Work on new features like other dictionaries, OCR, and static popup/lookup bar. Feel free to suggest/:thumbsup: more.

## Install

### Via The Store

Visit rikaikun on the Chrome Web Store and click 'Add to chrome'.

### As an Unpacked Extension

If you can't install it via the Chrome Web Store then you can install the source as an unpacked extension:

- Get the [latest release](https://github.com/melink14/rikaikun/releases) from Github:
- Follow [these instructions](https://github.com/web-scrobbler/web-scrobbler/wiki/Install-an-unpacked-extension) from the web-scrobbler Chrome extension. (substituting rikaikun where appropriate)

## Usage

Activate the extension by clicking on the 理 in the top right. When the introductory pop up appears, rikaikun is ready for action.

> Note: There is a bug where sometimes the 'On' badge appears active when Chrome first loads. In those cases, click the icon again and rikaikun will activate. (Issue #82)

When it's activated, when you hover over Japanese words they'll be translated in a pop up.

See it all in action in this [Youtube demo](https://www.youtube.com/watch?v=DFRTt6d0s3c) by [Tariq Sheikh](https://www.youtube.com/channel/UCRAL2bcBZ1Cw-xyPwelpi8A).

### Features

- Read out the Japanese words using Chrome Text To Speech capababilities. (Off by default)
- Change where the popup appears on your screen. (Where your mouse cursor is by default)
- Copy current definitions to they keyboard.
- Add a delay before popup is shown to avoid constant distractions.
- Require a modifier key to be held down in order to see popups.
- Hide definitions to see only the readings of words.

### Options

You can access the options from [the extension page](chrome://extensions/?options=jipdnfibhldikgcjhfnomkfpcebammhp) if you have it installed or by right clicking on the rikaikun icon.

#### Keyboard Shortcuts

<!-- Generated with https://www.tablesgenerator.com/markdown_tables -->

| Key         | Explanation                |
| ----------- | -------------------------- |
| A           | Alternate popup location   |
| Y           | Move popup location down   |
| C           | Copy to clipboard          |
| D           | Hide/show definitions      |
| Shift/Enter | Switch dictionaries        |
| B           | Previous character         |
| M           | Next character             |
| N           | Next word                  |
| J           | Scroll back definitions    |
| K           | Scroll forward definitions |

## Maintainers

[@melink14](https://github.com/melink14)
## Credits

- [Jon Zarate](https://www.polarcloud.com/) for their work on [Rikaichan](https://www.polarcloud.com/getrcx/)
- [Todd Rudick](http://www.rikai.com) for their work on the original [RikaiXUL](http://rikaixul.mozdev.org)
- This extension uses [JMdict/EDICT](http://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) and [KANJIDIC](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project) dictionary files. These files are the property of the [Electronic Dictionary Research and Development Group](http://www.edrdg.org/), and are used in conformance with the Group's [licence](http://www.edrdg.org/edrdg/licence.html).

## Contributing

Contribute by submitting pull requests, filing bug reports, submitting feature requests and more!

See [the contributing file](contributing.md) for the full details!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

### Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://qui.suis.je/"><img src="https://avatars2.githubusercontent.com/u/1272018?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aaron Muir Hamilton</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=xorgy" title="Code">💻</a></td>
    <td align="center"><a href="http://eiennohito.blogspot.com/"><img src="https://avatars1.githubusercontent.com/u/1021694?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Arseny Tolmachev</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=eiennohito" title="Code">💻</a></td>
    <td align="center"><a href="https://www.bazz1.com/"><img src="https://avatars0.githubusercontent.com/u/2224787?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Bazz</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=bazzinotti" title="Code">💻</a></td>
    <td align="center"><a href="https://birtles.wordpress.com/"><img src="https://avatars1.githubusercontent.com/u/1232595?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brian Birtles</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=birtles" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ChocoChopin"><img src="https://avatars1.githubusercontent.com/u/53260343?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ChocoChopin</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/issues?q=author:ChocoChopin+label:bug" title="Bug reports">🐛</a> <a href="https://github.com/melink14/rikaikun/issues?q=author:ChocoChopin+label:enhancement" title="Bug reports">🤔</a></td>
    <td align="center"><a href="https://www.darrenlester.com/"><img src="https://avatars2.githubusercontent.com/u/19534488?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Darren Lester</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=darren-lester" title="Code">💻</a></td>
    <td align="center"><a href="http://daviesodu.com/"><img src="https://avatars0.githubusercontent.com/u/11047321?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Davies Odu</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=Davodu" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://erekspeed.com"><img src="https://avatars3.githubusercontent.com/u/1176550?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Erek Speed</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=melink14" title="Code">💻</a> <a href="https://github.com/melink14/rikaikun/pulls?q=is%3Apr+reviewed-by%3Amelink14" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/melink14/rikaikun/issues?q=author:melink14+label:bug" title="Bug reports">🐛</a> <a href="#projectManagement-melink14" title="Project Management">📆</a> <a href="https://github.com/melink14/rikaikun/issues?q=author:melink14+label:enhancement" title="Bug reports">🤔</a></td>
    <td align="center"><a href="https://github.com/JakeH"><img src="https://avatars1.githubusercontent.com/u/3156017?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jake</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=JakeH" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/MayamaTakeshi"><img src="https://avatars3.githubusercontent.com/u/5127023?v=4?s=100" width="100px;" alt=""/><br /><sub><b>MayamaTakeshi</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=MayamaTakeshi" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Stephie"><img src="https://avatars0.githubusercontent.com/u/325983?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Stephie</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/pulls?q=is%3Apr+reviewed-by%3AStephie" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/tobiowo"><img src="https://avatars3.githubusercontent.com/u/1762224?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tobi Owoputi</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=tobiowo" title="Code">💻</a> <a href="https://github.com/melink14/rikaikun/issues?q=author:tobiowo+label:bug" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/versusvoid"><img src="https://avatars0.githubusercontent.com/u/3686499?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Versus</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=versusvoid" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/vikohone"><img src="https://avatars2.githubusercontent.com/u/963718?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ville Kohonen</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=vikohone" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Vwing"><img src="https://avatars2.githubusercontent.com/u/9121881?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vwing</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=Vwing" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/deshaun93"><img src="https://avatars1.githubusercontent.com/u/11935435?v=4?s=100" width="100px;" alt=""/><br /><sub><b>deshaun93</b></sub></a><br /><a href="https://github.com/melink14/rikaikun/commits?author=deshaun93" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sdcr"><img src="https://avatars3.githubusercontent.com/u/1684738?v=4?s=100" width="100px;" alt=""/><br /><sub><b>sdcr</b></sub></a><br /><a href="https://github.com/sdcr/heisig-kanjis" title="Data">🔣</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

[GPL-3.0 © 2020 Erek Speed](LICENSE)
