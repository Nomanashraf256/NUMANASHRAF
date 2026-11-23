class Phrases extends AudioWorkletProcessor {
  constructor() {
    super();
    this.reset();
    this.enabled = false;
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
    const loud = Math.sqrt(power / input.length) > 0.012;
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
    if (this.quiet >= sampleRate * .65 || this.length >= sampleRate * 10) {
      const pcm = new Float32Array(this.length);
      let index = 0;
      for (const part of this.parts) {
        pcm.set(part, index);
        index += part.length;
      }
      this.port.postMessage({pcm, rate:sampleRate}, [pcm.buffer]);
      this.reset();
    }
    return true;
  }
}
registerProcessor('phrases', Phrases);
