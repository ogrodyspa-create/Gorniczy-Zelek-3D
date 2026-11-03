# Spatial audio and procedural grass steps

## Camera-relative emitters

[`SpatialAudio`](../src/app/spatial-audio.ts) spatializes every sound effect
relative to the render camera. The Web Audio listener stays pinned at the origin
facing −Z; each emitter is given its source position already transformed into
camera space. This behaves identically on browsers that only expose the legacy
listener API, and it lets direction cues be shaped per emitter.

Emitters are persistent sound origins, not per-voice nodes. Voices connect to an
emitter's input, and the emitter owns one HRTF panner, one low-pass and one
distance gain. The number of HRTF panners is therefore bounded by sources (the
jelly, swing, trampoline, tricycle and soccer ball), never by voice count.

| Emitter | Origin | Reference distance |
| --- | --- | --- |
| Jelly contacts, grass steps and jumps | body centre lowered 2.5 cm to the contact point | `.35 m`, unit gain at `.30 m`, at most `1.5×` |
| Swing, trampoline | event position | `.35 m`; voices beyond `.9 m` are not started |
| Tricycle rolling and squeak loops | vehicle, each frame | `.55 m` |
| Soccer ball events | event position | `1.7 m` |

Distance gain is `1 / (1 + (d / reference)²)`, the same curve and references the
positional effects already used, so their balance is unchanged. Jelly sounds were
previously unattenuated; they are normalized to unit gain at the default orbit
distance so their typical loudness stays the same while still falling off as the
camera pulls away or closes in.

Direction is cued by HRTF with a 30 % forward bias, so a source directly beside
the camera sits near 67° rather than collapsing into one ear. This replaces the
former ±.65–.7 stereo-pan clamps. Sources behind the camera are low-passed toward
5.2 kHz (head shadow), and every source loses high end with distance
(cutoff halves at 2.4 m, scaled for the tabletop world).

Positions are refreshed once per rendered frame, after moving sources have
reported (`sound.listen(camera, body.center)` runs after tricycle and soccer
motion in the frame loop), with 25 ms parameter smoothing. A newly started voice
places its emitter immediately so it never glides in from the previous position.

## Reference-fitted grass run steps

The Soccer run step is synthesized by
[`grass-step.ts`](../src/worlds/soccer/grass-step.ts) to match the recording in
`refs/walk-on-grass.wav`. The recording is not shipped or played. It was
measured once, offline, into two small tables in that file:

- **Per-step envelopes:** for each of the recording's four steps, RMS level in
  nine octave bands (40 Hz–20 kHz) over 52 frames of 8 ms, stored as dB
  characters. This carries each step's heel strike, roll, push-off and tail in
  every band, including how highs and lows move independently.
- **Fine spectrum:** the long-term spectrum at 1/6-octave resolution, the shape
  inside each octave (for example the 50 Hz weight thump against the 80 Hz dip).

Each band is generated in the frequency domain with the same brick-wall edges
used for the measurement, shaped by the fine spectrum, normalized, then made
to follow its measured envelope. The two lowest bands first have their own
random swells divided out, because a band only tens of hertz wide otherwise
blurs its envelope. Bands above 2.8 kHz are driven by dense sub-millisecond
grains rather than smooth noise; that is the blade crackle, tuned to the
recording's high-band kurtosis (≈4.5, crunchy rather than hiss). Below 40 Hz the
recording's room rumble is deliberately not reproduced.

When fitted, every third-octave band from 50 Hz to 16 kHz matched within about
±2.5 dB, band envelopes above 180 Hz followed the recording frame by frame
(correlation 0.90–0.99) and crackle kurtosis matched per step. The two lowest
bands cannot be compared frame by frame: an 8 ms frame is shorter than one cycle
there. To re-fit, re-measure the recording into the same tables and compare a
render at the recording's step spacing on those three measures.

Eight variants pair the four measured steps with different noise seeds. Each
takes ~30 ms to generate, so they are built one per task (never one long block)
under the loading card, or as soon as audio unlocks while already on the
pitch; the first step uses whatever is ready. Playback never repeats the
previous variant and varies rate by ±4 % and level by ±10 %. Steps keep the
recording's full ~0.43 s length and are scheduled on the audio clock with a
120 ms lookahead at the fixed 3.55 Hz cadence (±3 % jitter), so consecutive run
steps overlap into a continuous crunch. Takeoff and landing still use the
`grass_movement_sound_lab_v2.html` contact graph.
