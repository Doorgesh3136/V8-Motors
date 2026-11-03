"""Synthesises the home-page intro sound: a supercharged cross-plane V8 (modelled on the
Range Rover's 5.0 litre) starting, idling, blipping, launching through a gear change,
popping on the overrun and backfiring, with a cinematic boom on the logo.

  python3 scripts/audio/engine.py public/intro/engine.wav   (then encode to mp3 with ffmpeg)

Every moment is placed on a fixed timeline so the intro's picture can be keyed to it:
  0.30  starter cranks          1.15  it catches, flares, settles to a burbling idle
  3.90  first blip              4.95  second, harder blip with pops
  5.85  launch: full throttle to the limiter, 6.95 gear change, pulls again
  7.75  lift off: crackles, 7.92 backfire + boom (logo slam), long burbling run-down
"""
import sys
import numpy as np
from scipy import signal

FS = 44100
DUR = 11.2
N = int(FS * DUR)
t = np.arange(N) / FS
rng = np.random.default_rng(5)

# ------------------------------------------------------------------ rpm and throttle automation
def ramp(a, b, t0, t1, shape=1.0):
    """0..1 ramp between t0 and t1 (eased), used to build automation curves."""
    x = np.clip((t - t0) / (t1 - t0), 0, 1)
    return x ** shape

rpm = np.full(N, 0.0)
thr = np.zeros(N)

def seg(t0, t1):
    return (t >= t0) & (t < t1)

# crank: ~210 rpm, slowing on each compression stroke
m = seg(0.30, 1.15)
rpm[m] = 210 + 25 * np.sin(2 * np.pi * 14 * t[m])
# catch and flare to 1750, then settle exponentially to a 700 rpm idle (with gentle hunting)
def settle(t0, r0, r1, tau):
    return r1 + (r0 - r1) * np.exp(-(t - t0) / tau)
m = seg(1.15, 1.50); rpm[m] = 230 + (1750 - 230) * (1 - np.exp(-(t[m] - 1.15) / 0.11)) / (1 - np.exp(-0.35 / 0.11))
m = seg(1.50, 3.90); rpm[m] = settle(1.50, 1750, 700, 0.32)[m] + 12 * np.sin(2 * np.pi * 0.7 * t[m])
thr[seg(1.15, 1.42)] = 0.55
thr[seg(1.42, 3.90)] = 0.12
# blip 1: 3.90 to 3200
def blip(t0, up, peak, r_from, r_to, tau, th):
    m = seg(t0, t0 + up)
    x = (t[m] - t0) / up
    rpm[m] = r_from + (peak - r_from) * np.sin(x * np.pi / 2) ** 1.4
    thr[m] = th
    return t0 + up, peak
t1, p = blip(3.90, 0.28, 3200, 700, 900, 0.22, 0.8)
m = seg(t1, 4.95); rpm[m] = settle(t1, p, 800, 0.24)[m]; thr[m] = 0.05
# blip 2: harder, to 4800
t1, p = blip(4.95, 0.32, 4800, rpm[int(4.95 * FS) - 1], 1000, 0.25, 1.0)
m = seg(t1, 5.85); rpm[m] = settle(t1, p, 950, 0.2)[m]; thr[m] = 0.0
# launch: full throttle, climbs to the limiter (6300)
r0 = rpm[int(5.85 * FS) - 1]
m = seg(5.85, 6.75); x = (t[m] - 5.85) / 0.90
rpm[m] = r0 + (6300 - r0) * (1 - (1 - x) ** 1.8); thr[m] = 1.0
# limiter: fuel cut chops at ~16 Hz, rpm bounces
m = seg(6.75, 6.95)
chop = (np.sin(2 * np.pi * 16 * (t[m] - 6.75)) > 0)
rpm[m] = 6220 + 80 * np.sin(2 * np.pi * 16 * (t[m] - 6.75)); thr[m] = np.where(chop, 1.0, 0.0)
# gear change: throttle cut, rpm drops to 4300, then pulls again in second
m = seg(6.95, 7.05); rpm[m] = 6250 - (6250 - 4300) * np.sin((t[m] - 6.95) / 0.10 * np.pi / 2); thr[m] = 0.0
m = seg(7.05, 7.75); x = (t[m] - 7.05) / 0.70
rpm[m] = 4300 + (6150 - 4300) * (1 - (1 - x) ** 1.5); thr[m] = 1.0
# lift off: long run-down with crackles, back to idle
m = seg(7.75, DUR); rpm[m] = settle(7.75, 6150, 700, 0.55)[m] + 10 * np.sin(2 * np.pi * 0.6 * t[m]) * ramp(0, 1, 9.0, 10.0)[m]
thr[m] = 0.02
thr[seg(9.3, DUR)] = 0.12

# smooth the throttle a little (no clicks), keep rpm as is
b, a = signal.butter(1, 40 / (FS / 2))
thr = signal.lfilter(b, a, thr)
running = t >= 1.15  # combustion from the catch onwards

# ------------------------------------------------------------------ firing events
# crank angle in degrees; one combustion every 90 deg, cross-plane firing order 1-5-4-8-6-3-7-2
theta = np.cumsum(rpm / 60 * 360 / FS)
k = np.arange(1, int(theta[-1] // 90))
idx = np.searchsorted(theta, k * 90.0)
idx = idx[idx < N]
k = k[: len(idx)]
ORDER = [1, 5, 4, 8, 6, 3, 7, 2]
bank = np.array([0 if ORDER[i % 8] <= 4 else 1 for i in k])
cyl = np.array([ORDER[i % 8] for i in k])

trainA_soft = np.zeros(N); trainA_hard = np.zeros(N)
trainB_soft = np.zeros(N); trainB_hard = np.zeros(N)
pops = np.zeros(N)
cyl_gain = 1 + 0.035 * rng.standard_normal(9)  # a healthy engine: cylinders within a few percent
for i, b_, c in zip(idx, bank, cyl):
    th = thr[i]
    if not running[i]:
        amp = 0.10  # cranking: compression puffs only
        hard = 0.0
    else:
        load = 0.45 + 0.55 * th
        amp = load * (0.75 + 0.25 * min(1, rpm[i] / 6000)) * cyl_gain[c] * (1 + 0.03 * rng.standard_normal())
        hard = th
        # overrun: fuel cut at high rpm with no throttle -> unburnt fuel pops in the hot exhaust
        if th < 0.15 and rpm[i] > 1300 and t[i] > 4.0:
            p = 0.10 + 0.25 * min(1, (rpm[i] - 1300) / 3500)
            if rng.random() < p:
                pops[i] += (0.35 + 0.65 * rng.random()) * min(1, rpm[i] / 4000)
    soft = amp * (1 - hard); hrd = amp * hard
    if b_ == 0:
        trainA_soft[i] += soft; trainA_hard[i] += hrd
    else:
        trainB_soft[i] += soft; trainB_hard[i] += hrd

def kernel(tau_ms, length_ms=12):
    n = int(FS * length_ms / 1000); x = np.arange(n) / FS / (tau_ms / 1000)
    g = x * np.exp(1 - x)
    return g / g.sum()

# blowdown pulse: rounder when lightly loaded, sharper with the throttle open
def bank_signal(soft, hard, shift):
    x = signal.fftconvolve(soft, kernel(0.9), mode='full')[:N] + signal.fftconvolve(hard, kernel(0.35), mode='full')[:N] * 1.2
    x = x - signal.lfilter(*signal.butter(1, 20 / (FS / 2)), x)  # remove DC
    out = np.zeros(N)
    # exhaust resonances (header, mid-pipe, muffler shell), slightly different per bank
    for f, q, g in [(92, 2.2, 0.45), (185, 3.0, 1.0), (330, 3.5, 0.85), (560, 4.0, 0.5), (900, 4.0, 0.3), (1500, 4.0, 0.15), (2600, 3.0, 0.06)]:
        bb, aa = signal.iirpeak(f * shift / (FS / 2), q)
        out += g * signal.lfilter(bb, aa, x)
    out += 0.25 * x
    # pipe: a feedback comb (quarter-wave tube)
    d = int(FS * 0.0042 * shift)
    out = signal.lfilter([1.0], np.r_[1.0, np.zeros(d - 1), -0.32], out)
    return out

A = bank_signal(trainA_soft, trainA_hard, 1.0)
B = bank_signal(trainB_soft, trainB_hard, 1.07)
exhaust = A + B * 0.92

# muffler: darker at idle and part throttle, opens up under load (crossfade two filtered versions)
dark = signal.sosfilt(signal.butter(2, 750 / (FS / 2), output='sos'), exhaust)
brightness = np.clip(0.25 + 0.75 * thr * np.clip(rpm / 4500, 0.3, 1), 0, 1)
exhaust = dark * (1 - brightness) + exhaust * brightness
# level: the launch sits at a fixed loudness, everything else is mixed relative to it
L = seg(6.0, 6.7)
exhaust *= 0.20 / np.sqrt((exhaust[L] ** 2).mean())
# a little saturation for growl under load
drive = 1 + 1.5 * thr
exhaust = np.tanh(exhaust * 2.2 * drive) / (2.2 * drive) * (1 + 0.5 * thr)

# ------------------------------------------------------------------ intake roar and supercharger
noise = rng.standard_normal(N)
env_fire = signal.fftconvolve(trainA_soft + trainA_hard + trainB_soft + trainB_hard, kernel(3.0, 30), mode='full')[:N]
env_fire /= env_fire.max() + 1e-9
roar = signal.sosfilt(signal.butter(2, [280 / (FS / 2), 1400 / (FS / 2)], btype='band', output='sos'), noise)
roar *= (0.4 + 0.6 * env_fire) * thr * np.clip(rpm / 6000, 0, 1) * 0.05

whine_f = rpm / 60 * 23.0  # blower drive ratio x lobes: ~2.4 kHz at the limiter
ph = 2 * np.pi * np.cumsum(whine_f) / FS
whine_level = 0.018 * (rpm / 6000) ** 2 * (0.35 + 0.65 * thr) * running
whine = whine_level * (np.sin(ph) + 0.35 * np.sin(2 * ph + 0.3) + 0.12 * np.sin(3 * ph))
whine *= 1 + 0.15 * np.sin(2 * np.pi * rpm / 60 * t)  # slight beating
boost = signal.sosfilt(signal.butter(2, [1500 / (FS / 2), 4500 / (FS / 2)], btype='band', output='sos'), noise * 0.5)
boost *= 0.012 * thr * (rpm / 6000) ** 1.5

# ------------------------------------------------------------------ starter motor
st = seg(0.30, 1.22).astype(float)
st_env = st * ramp(0, 1, 0.30, 0.34) * (1 - ramp(0, 1, 1.12, 1.22))
st_f = 165 + 18 * np.sin(2 * np.pi * 14 * t)  # motor labours on each compression
st_ph = 2 * np.pi * np.cumsum(st_f) / FS
starter = signal.sawtooth(st_ph, 0.3) * 0.5 + 0.3 * np.sin(2 * st_ph)
starter = signal.sosfilt(signal.butter(2, [120 / (FS / 2), 2200 / (FS / 2)], btype='band', output='sos'), starter)
starter += 0.06 * signal.sosfilt(signal.butter(2, [2000 / (FS / 2), 5000 / (FS / 2)], btype='band', output='sos'), noise)  # gear mesh
starter *= st_env * (0.75 + 0.25 * np.sin(2 * np.pi * 14 * t)) * 0.07

# ------------------------------------------------------------------ pops, backfire, boom
pop_k = rng.standard_normal(int(FS * 0.012)) * np.exp(-np.arange(int(FS * 0.012)) / (FS * 0.0025))
pop_s = signal.fftconvolve(pops, pop_k, mode='full')[:N]
pop_s = signal.sosfilt(signal.butter(2, [350 / (FS / 2), 4000 / (FS / 2)], btype='band', output='sos'), pop_s) * 1.6
thump_k = np.sin(2 * np.pi * 75 * np.arange(int(FS * 0.06)) / FS) * np.exp(-np.arange(int(FS * 0.06)) / (FS * 0.012))
pop_s += signal.fftconvolve(pops, thump_k, mode='full')[:N] * 0.10

def hit(at, length, f0, f1, decay, level):
    n = int(FS * length); tt = np.arange(n) / FS
    f = f1 + (f0 - f1) * np.exp(-tt / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(f) / FS) * np.exp(-tt / decay)
    out = np.zeros(N); i = int(at * FS); out[i:i + n] = s[: N - i]
    return out * level

bang = np.zeros(N); i = int(7.92 * FS); n = int(FS * 0.05)
bang[i:i + n] = rng.standard_normal(n) * np.exp(-np.arange(n) / (FS * 0.008))
bang = signal.sosfilt(signal.butter(2, [200 / (FS / 2), 5000 / (FS / 2)], btype='band', output='sos'), bang) * 1.4
bang += hit(7.92, 0.25, 160, 55, 0.05, 0.35)
# cinematic boom on the logo: a sub drop with harmonics, so phone speakers carry it too
boom = hit(7.92, 2.6, 110, 36, 0.75, 1.0)
boom = np.tanh(boom * 2.2) * 0.32
boom += hit(7.92, 0.6, 900, 120, 0.04, 0.05)
# a riser into the launch
riser = signal.sosfilt(signal.butter(2, [600 / (FS / 2), 6000 / (FS / 2)], btype='band', output='sos'), noise)
riser *= ramp(0, 1, 5.25, 5.85, 2.2) * (1 - ramp(0, 1, 5.85, 5.95)) * 0.05

# ------------------------------------------------------------------ mix, space, master
dry = exhaust + roar + whine + boost + starter + pop_s + bang + riser
ir_n = int(FS * 1.1); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (FS * 0.28))
ir = signal.sosfilt(signal.butter(2, 2500 / (FS / 2), output='sos'), ir); ir /= np.sqrt((ir ** 2).sum())
wet = signal.fftconvolve(dry + bang * 2, ir, mode='full')[:N]
mix = dry + 0.22 * wet + boom
mix = signal.sosfilt(signal.butter(2, 30 / (FS / 2), btype='high', output='sos'), mix)
mix *= np.minimum(1, ramp(0, 1, 0.28, 0.3) + (t < 0.28) * 0) * (1 - ramp(0, 1, 10.6, 11.15))
mix = np.tanh(mix * 1.3) / 1.3  # gentle limiter
mix *= 0.89 / max(0.89, np.abs(mix).max())  # peaks no higher than -1 dBFS
out = sys.argv[1] if len(sys.argv) > 1 else 'engine.wav'
from scipy.io import wavfile
wavfile.write(out, FS, (mix * 32767).astype(np.int16))
print('wrote', out)
