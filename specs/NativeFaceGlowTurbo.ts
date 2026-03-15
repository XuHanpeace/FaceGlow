import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getDeviceUptimeMsSync(): number;
  echoSync(value: string): string;
  measureLoopAsync(iterations: number): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('NativeFaceGlowTurbo');
