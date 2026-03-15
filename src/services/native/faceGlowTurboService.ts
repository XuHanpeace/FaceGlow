import NativeFaceGlowTurbo from '../../../specs/NativeFaceGlowTurbo';

class FaceGlowTurboService {
  isAvailable(): boolean {
    return !!NativeFaceGlowTurbo;
  }

  getDeviceUptimeMsSync(): number | null {
    if (!NativeFaceGlowTurbo) {
      return null;
    }
    return NativeFaceGlowTurbo.getDeviceUptimeMsSync();
  }

  echoSync(value: string): string | null {
    if (!NativeFaceGlowTurbo) {
      return null;
    }
    return NativeFaceGlowTurbo.echoSync(value);
  }

  async measureLoopAsync(iterations: number): Promise<number | null> {
    if (!NativeFaceGlowTurbo) {
      return null;
    }
    return NativeFaceGlowTurbo.measureLoopAsync(iterations);
  }
}

export const faceGlowTurboService = new FaceGlowTurboService();
