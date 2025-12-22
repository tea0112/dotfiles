# MPV Player Controls Guide

Complete reference for all keyboard shortcuts and controls in your mpv configuration.

## 📍 Seek Controls (Backward/Forward)

### Arrow Keys
- **→ (RIGHT)** - Seek 5 seconds forward
- **← (LEFT)** - Seek 5 seconds backward
- **↑ (UP)** - Seek 10 seconds forward
- **↓ (DOWN)** - Seek 10 seconds backward

### Number Keys (3s, 5s, 15s, 30s intervals)
- **1** - Seek 3 seconds backward
- **2** - Seek 3 seconds forward
- **3** - Seek 5 seconds backward
- **4** - Seek 5 seconds forward
- **5** - Seek 15 seconds backward
- **6** - Seek 15 seconds forward
- **7** - Seek 30 seconds backward
- **8** - Seek 30 seconds forward

### Frame-by-Frame (Precise Control)
- **.** (period) - Advance one frame forward
- **,** (comma) - Go back one frame backward
- **Shift + .** - Seek exactly 1 second forward (exact, no keyframe limitation)
- **Shift + ,** - Seek exactly 1 second backward (exact)

### Longer Seeks
- **Page Up** - Seek to next chapter
- **Page Down** - Seek to previous chapter
- **Shift + Page Up** - Seek 10 minutes forward
- **Shift + Page Down** - Seek 10 minutes backward

### Mouse Wheel (when hovering over video)
- **Scroll Up** - Seek 5 seconds forward
- **Scroll Down** - Seek 5 seconds backward
- **Shift + Scroll Up** - Seek 3 seconds forward
- **Shift + Scroll Down** - Seek 3 seconds backward

### Subtitle-Based Seeking
- **Ctrl + →** - Seek to next subtitle
- **Ctrl + ←** - Seek to previous subtitle

### Undo Seek
- **Shift + Backspace** - Undo the previous seek
- **Shift + Ctrl + Backspace** - Mark position for revert-seek

---

## 🎬 Playback Speed Controls

- **[** - Decrease playback speed (multiply by 0.9091)
- **]** - Increase playback speed (multiply by 1.1)
- **{** - Slow down significantly (multiply by 0.3)
- **}** - Speed up significantly (multiply by 2.0)
- **Backspace** - Reset speed to normal (1.0x)

---

## 📝 Primary Subtitle Controls

- **j** - Cycle through available subtitle tracks (next)
- **J** (Shift+j) - Cycle backwards through subtitle tracks
- **v** - Toggle visibility (show/hide primary subtitles)
- **z** - Adjust subtitle delay -0.1 seconds (shift earlier)
- **Z** - Adjust subtitle delay +0.1 seconds (delay later)
- **r** - Move subtitles up (only works for text subs, not image-based like DVD/Bluray)
- **R** - Move subtitles down

---

## 📝 Secondary Subtitle Controls (Dual Subs)

The secondary subtitle is managed by the `dual_subs.lua` script and automatically skips the track currently used as primary.

- **k** - Cycle through available tracks for the secondary subtitle
- **K** (Shift+k) - Toggle secondary subtitle visibility (On/Off)

**Note:** Secondary subtitles are positioned at the top of the screen (secondary-sub-pos=0), while primary subtitles are at the bottom (sub-pos=100).

---

## 🎨 ModernZ Interface Controls

- **DEL** - Toggle ModernZ interface visibility (cycle through: never, auto, always)

---

## 🎮 Other Useful Controls

### Playback
- **SPACE** or **p** - Toggle pause/playback
- **q** - Quit mpv
- **Q** - Quit and remember playback position (watch-later)

### Fullscreen & Window
- **f** - Toggle fullscreen
- **T** - Toggle window always on top

### Volume
- **9** or **/** - Decrease volume by 2
- **0** or ***** - Increase volume by 2
- **m** - Toggle mute

### Screenshots
- **s** - Screenshot with subtitles
- **S** - Screenshot without subtitles (video only)
- **Ctrl + s** - Screenshot of window with OSD

### Information
- **i** - Display information and statistics
- **I** - Toggle information display
- **F9** - Show track list (video, audio, subtitles)

---

## 📋 Configuration Files

- **mpv.conf** - Main configuration file
- **input.conf** - Keyboard and mouse bindings
- **script-opts/modernz.conf** - ModernZ OSC customization
- **scripts/dual_subs.lua** - Dual subtitle management script

---

## 💡 Tips

1. **Subtitle Auto-Loading**: mpv is configured to auto-load external subtitle files (`sub-auto=all`). Files like `VideoName_en.srt` and `VideoName_vi.srt` will be automatically loaded.

2. **Language Preference**: English subtitles are preferred first, then Vietnamese (`slang=en,vi`).

3. **Dual Subtitles**: Use primary subtitle (bottom) for your main language and secondary subtitle (top) for translation/reference.

4. **Exact Seeking**: Use `Shift + .` or `Shift + ,` for frame-accurate seeking without keyframe limitations.

5. **Quick Navigation**: Use number keys (1-8) for quick 3/5/15/30 second seeks, or arrow keys for 5/10 second seeks.
