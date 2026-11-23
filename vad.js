class Phrases extends AudioWorkletProcessor {
  constructor() {
    super();
    this.reset();
    this.enabled = false;
    this.noiseFloor = .003;
    this.port.onmessage = ({data}) => {
      if (this.enabled !== data) this.reset();
      this.enabled = data;
    };
  }
  reset() {
    this.before = [];
    this.parts = [];
    this.length = 0;
    this.hot = 0;
    this.quiet = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!this.enabled || !input?.length) return true;
    let power = 0;
    for (const value of input) power += value * value;
    const level = Math.sqrt(power / input.length);
    const threshold = Math.max(.008, Math.min(.026, this.noiseFloor * 2.6));
    const loud = level > threshold;
    if (!this.length && !this.hot && (!loud || level < .018)) {
      this.noiseFloor = .985 * this.noiseFloor + .015 * level;
    }
    this.hot = loud ? this.hot + input.length : Math.max(0, this.hot - input.length);
    if (!this.length) {
      this.before.push(input.slice());
      if (this.before.length * input.length > sampleRate * .25) this.before.shift();
      if (this.hot < sampleRate * .09) return true;
      this.parts = this.before;
      this.length = this.parts.length * input.length;
      this.port.postMessage({listening:true});
      return true;
    }
    this.parts.push(input.slice());
    this.length += input.length;
    this.quiet = loud ? 0 : this.quiet + input.length;
    if (this.quiet >= sampleRate * .48 || this.length >= sampleRate * 10) {
      const trailing = Math.max(0, this.quiet - Math.round(sampleRate * .18));
      const pcm = new Float32Array(this.length - trailing);
      let index = 0;
      for (const part of this.parts) {
        if (index >= pcm.length) break;
        const kept = Math.min(part.length, pcm.length - index);
        pcm.set(part.subarray(0, kept), index);
        index += kept;
      }
      this.port.postMessage({pcm, rate:sampleRate}, [pcm.buffer]);
      this.reset();
    }
    return true;
  }
}
registerProcessor('phrases', Phrases);
