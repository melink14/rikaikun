This is a port of rikaichan, but it doesn't have all the features.  It doesn't even do anything new or exciting, but maybe that will change.

For those of you that don't know, rikaichan is a firefox extension that emulates the popup translations of rikaixul.  It's perhaps the best inline translation of Japanese.

I started with the idea that I would make a the chrome equivalent of rikaichan from scratch using my own ideas.  However, after I tried rikaichan, I realized that it's already quite good and starting from 0 when he already has numerous iterations would be wasting the excellent work done by those developers.

Thus, we have a straight port of rikaichan in chrome as close as possible to the original.

# Differences #

---

There is no toolbar support in chrome since it clutters the interface, so I took out the look up bar completely.  If enough people seem to want it, a pseudo tool bar could be created.

Saving files seems to be impossible at the moment.  Unlike mozilla, chrome doesn't have an api for local file access and thus we're out of luck.

The names and other language dictionaries are not supported right now but will be implemented soon.

There are other differences of course but they're mostly in a waiting to implemented stage.  If there's something that seems to be missing file an issue if one doesn't exist already.

# Other Stuff #

---

If you find bugs, file an issue if one doesn't exist.  In particular, I'm interested in cases where rikaikun doesn't register a character it should.  When filing those issues, it's best if you can give a link and which area of the page the problem is occurring in.

# Thanks #

---

Thanks Jon Zarate for the work on Rikaichan.

Thanks to his contributors as well.

Thanks to Todd Rudick for the work on rikaixul.


This extension uses [JMDICT](http://www.csse.monash.edu.au/~jwb/jmdict.html) and [KANJIDIC](http://www.csse.monash.edu.au/~jwb/kanjidic.html) dictionary files. These files are the property of the [Electronic Dictionary Research and Development Group](http://www.edrdg.org/), and are used in conformance with the Group's licence.


# Copyright Stuff #

---

> Rikaikun
> Copyright (C) 2010 Erek Speed
> http://web.mit.edu/espeed/www

> ---

> Originally based on Rikaichan 1.07
> by Jonathan Zarate
> http://www.polarcloud.com/

> ---

> Originally based on RikaiXUL 0.4 by Todd Rudick
> http://www.rikai.com/
> http://rikaixul.mozdev.org/

> ---

> This program is free software; you can redistribute it and/or modify
> it under the terms of the GNU General Public License as published by
> the Free Software Foundation; either version 2 of the License, or
> (at your option) any later version.

> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
> GNU General Public License for more details.

> You should have received a copy of the GNU General Public License
> along with this program; if not, write to the Free Software
> Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA