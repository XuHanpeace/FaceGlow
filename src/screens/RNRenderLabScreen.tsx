import React, { useCallback, useMemo, useState } from 'react';
import {
  InteractionManager,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MMKV } from 'react-native-mmkv';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../components/BackButton';
import { faceGlowTurboService } from '../services/native/faceGlowTurboService';
import { RootStackParamList } from '../types/navigation';

type RNRenderLabScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ExperimentKey = 'exp1' | 'exp2' | 'exp3' | 'exp4' | 'exp5' | 'exp6' | 'exp7' | 'exp8';

type LogEntry = {
  id: string;
  title: string;
  metrics: string;
  interpretation: string;
  idea: string;
};

const MAX_LOG_COUNT = 100;
const mmkvStorage = new MMKV({ id: 'rn-render-lab-storage' });

const ONE_LINER_ANSWERS: Record<ExperimentKey, string> = {
  exp1: '新架构优化初始化通信的核心是先压缩首包字节量，再减少跨层序列化次数，最后把非关键数据延后到交互后处理。',
  exp2: '从 Native 视角看，旧桥接是消息队列往返，Turbo/JSI 是直连运行时，高频轻量调用延迟和抖动都更低。',
  exp3: '大数据更新要做分层分片：关键数据先到主线程可见，非关键数据后台补齐，避免一次大包压垮内存和主线程。',
  exp4: '通信调度要让位于用户交互，把非关键模块初始化放到 runAfterInteractions，优先保障首屏可操作性。',
  exp5: '序列化成本会随数据规模放大，优化方向是减少动态大对象跨层传输，优先使用 JSI/Turbo 的轻量契约接口。',
  exp6: 'Native 异步调用的瓶颈常在队列切换和主线程竞争，解决思路是批量化调用、减少 chatty calls、补齐链路埋点。',
  exp7: 'JSI 同步能力适合高频小数据读取，但 Native 重任务仍应异步化，否则会反向阻塞 JS 线程。',
  exp8: 'TurboModule 设计要按职责拆分：同步接口负责快读，异步接口负责重算，配合 codegen 保证跨端契约稳定。',
};

const RNRenderLabScreen: React.FC = () => {
  const navigation = useNavigation<RNRenderLabScreenNavigationProp>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [payloadSize, setPayloadSize] = useState(2000);
  const [round, setRound] = useState(200);

  const appendInsight = useCallback(
    (title: string, metrics: string, interpretation: string, idea: string) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title,
        metrics,
        interpretation,
        idea,
      };
      console.log(
        `[RNNativeLab][${title}] metrics=${metrics} | interpretation=${interpretation} | idea=${idea}`,
      );
      setLogs(prev => [entry, ...prev].slice(0, MAX_LOG_COUNT));
    },
    [],
  );

  const runtimeInfo = useMemo(() => {
    const globalAny = global as any;
    return {
      hasTurboModuleProxy: typeof globalAny.__turboModuleProxy === 'function',
      isBridgeless: !!globalAny.RN$Bridgeless,
      isHermes: !!globalAny.HermesInternal,
      nativeModuleCount: Object.keys(NativeModules || {}).length,
    };
  }, []);

  const copyOneLiner = useCallback(
    (key: ExperimentKey) => {
      const line = ONE_LINER_ANSWERS[key];
      Clipboard.setString(line);
      appendInsight(
        `话术复制: ${key.toUpperCase()}`,
        'clipboard=updated',
        '已复制一句话标准答案，可以直接用于面试陈述。',
        '讲述时先报数据，再给 Native 侧原因，最后给改进策略。',
      );
    },
    [appendInsight],
  );

  const buildPayload = useCallback((size: number) => {
    return {
      app: 'FaceGlow',
      scene: 'app-init-and-update',
      ts: Date.now(),
      nativeConfig: {
        moduleCount: 12,
        shouldWarmup: true,
      },
      modules: Array.from({ length: size }, (_, i) => ({
        key: `k_${i}`,
        value: `v_${i}`,
        priority: i % 3,
      })),
    };
  }, []);

  const runInitPayloadExperiment = useCallback(async () => {
    const payload = buildPayload(payloadSize);

    const startSerialize = Date.now();
    const json = JSON.stringify(payload);
    const endSerialize = Date.now();

    const startParse = Date.now();
    JSON.parse(json);
    const endParse = Date.now();

    let nativeHop = -1;
    try {
      const nativeCOS = (NativeModules as any)?.NativeCOS;
      if (nativeCOS?.isInitialized) {
        const hopStart = Date.now();
        await nativeCOS.isInitialized();
        nativeHop = Date.now() - hopStart;
      }
    } catch {
      nativeHop = -1;
    }

    appendInsight(
      '实验1: 初始化通信画像',
      `payloadItems=${payloadSize}, approxBytes=${json.length}, stringify=${endSerialize - startSerialize}ms, parse=${endParse - startParse}ms, nativeHop=${nativeHop >= 0 ? `${nativeHop}ms` : 'N/A'}`,
      'Native 视角看初始化慢通常是首包过大 + 桥接往返，先把跨层数据体积和次数压下去才能稳首屏。',
      '把配置拆成 critical / non-critical，两阶段下发；主线程只接收必要字段，剩余模块懒初始化。',
    );
  }, [appendInsight, buildPayload, payloadSize]);

  const runBridgeVsTurboExperiment = useCallback(async () => {
    const nativeCOS = (NativeModules as any)?.NativeCOS;

    let legacyCost = -1;
    if (nativeCOS?.isInitialized) {
      const start = Date.now();
      for (let i = 0; i < round; i += 1) {
        await nativeCOS.isInitialized();
      }
      legacyCost = Date.now() - start;
    }

    let turboSyncCost = -1;
    if (faceGlowTurboService.isAvailable()) {
      const start = Date.now();
      for (let i = 0; i < round; i += 1) {
        faceGlowTurboService.echoSync(`ping-${i}`);
      }
      turboSyncCost = Date.now() - start;
    }

    appendInsight(
      '实验2: 旧桥接 vs Turbo 调用',
      `round=${round}, legacyAsync=${legacyCost >= 0 ? `${legacyCost}ms` : 'N/A'}, turboSync=${turboSyncCost >= 0 ? `${turboSyncCost}ms` : 'N/A'}`,
      '从 Native 队列角度，旧桥接每次都需要消息封装与调度；Turbo 直连减少中间层，抖动更小。',
      '把高频 getter 迁移到 Turbo 同步接口，把重计算留给异步 Promise，避免 JS 与主线程互相抢占。',
    );
  }, [appendInsight, round]);

  const runPayloadStrategyExperiment = useCallback(() => {
    const s1 = Date.now();
    const onceJson = JSON.stringify(buildPayload(payloadSize * 3));
    JSON.parse(onceJson);
    const onceCost = Date.now() - s1;

    const s2 = Date.now();
    for (let i = 0; i < 3; i += 1) {
      const chunkJson = JSON.stringify(buildPayload(payloadSize));
      JSON.parse(chunkJson);
    }
    const chunkCost = Date.now() - s2;

    appendInsight(
      '实验3: 大包 vs 分片',
      `singleShot=${onceCost}ms, chunked=${chunkCost}ms, baseItems=${payloadSize}`,
      '一次大包可能更快结束，但 Native 端峰值内存和主线程压力更高；分片更利于可控降级与重试。',
      '首屏优先发用户可见字段，后台并行补齐次要数据，失败时只重试失败分片而不是整包重发。',
    );
  }, [appendInsight, buildPayload, payloadSize]);

  const runSchedulingExperiment = useCallback(() => {
    const start = Date.now();
    InteractionManager.runAfterInteractions(() => {
      appendInsight(
        '实验4: 调度时机',
        `runAfterInteractionsDelay=${Date.now() - start}ms`,
        'Native 视角下，交互期主线程最敏感，把通信和模块预热延后可显著降低卡顿体感。',
        '把首屏路径中的非关键 native 调用统一收敛到 idle/interaction 后执行，并设定超时兜底。',
      );
    });
  }, [appendInsight]);

  const runBridgePayloadExperiment = useCallback(() => {
    const payload = {
      list: Array.from({ length: payloadSize }, (_, i) => ({
        id: i,
        value: `v_${i}`,
      })),
    };
    const t1 = Date.now();
    const serialized = JSON.stringify(payload);
    JSON.parse(serialized);
    const t2 = Date.now();
    const t3 = Date.now();
    const tail = payload.list[payload.list.length - 1]?.value;
    const t4 = Date.now();

    appendInsight(
      '实验5: 序列化成本放大',
      `payloadItems=${payloadSize}, jsonRoundTrip=${t2 - t1}ms, directRead=${t4 - t3}ms, tail=${tail}`,
      'Native 通信性能劣化常见于对象序列化膨胀；数据越大，这个固定开销越显著。',
      '热路径避免传结构化大对象，改成标识符 + Native 侧缓存，或用 JSI 共享数据访问。',
    );
  }, [appendInsight, payloadSize]);

  const runNativeModuleAsyncExperiment = useCallback(async () => {
    const module = (NativeModules as any)?.NativeCOS;
    if (!module?.isInitialized) {
      appendInsight(
        '实验6: Native 异步调用',
        'NativeCOS.isInitialized=N/A',
        '模块不可用说明生命周期或装配链路有问题，先确认 target、autolink、初始化顺序。',
        '建立 availability guard + fallback，防止单点模块异常拖垮主流程。',
      );
      return;
    }

    const start = Date.now();
    try {
      const result = await module.isInitialized();
      appendInsight(
        '实验6: Native 异步调用',
        `nativeAsyncCost=${Date.now() - start}ms, result=${JSON.stringify(result)}`,
        '异步调用时延由 JS 调度、native queue、主线程负载共同决定，不是单点函数时间。',
        '减少碎片调用，把多次探测合并成一次批量请求，并在 Native 侧做状态缓存。',
      );
    } catch (error: any) {
      appendInsight(
        '实验6: Native 异步调用',
        `nativeAsyncCost=${Date.now() - start}ms, error=${error?.message || error}`,
        '失败通常是线程约束或参数契约不一致，从 Native 入口到 JS 回调要有完整埋点。',
        '把调用链拆成入口、执行、回调三段打点，定位到底是队列阻塞还是模块异常。',
      );
    }
  }, [appendInsight]);

  const runSyncJSIExperiment = useCallback(() => {
    const start = Date.now();
    for (let i = 0; i < 4000; i += 1) {
      mmkvStorage.set(`k_${i}`, i);
      mmkvStorage.getNumber(`k_${i}`);
    }
    const elapsed = Date.now() - start;
    appendInsight(
      '实验7: JSI 同步读写',
      `mmkvSyncReadWrite4000=${elapsed}ms`,
      '同步 JSI 读写适合高频轻量场景，但其本质仍占用 JS 线程预算。',
      '把同步接口限定为小数据快读，重运算交给 Native 后台线程再异步回传。',
    );
  }, [appendInsight]);

  const runTurboModuleExperiment = useCallback(async () => {
    if (!faceGlowTurboService.isAvailable()) {
      appendInsight(
        '实验8: TurboModule 混合调用',
        'NativeFaceGlowTurbo=Unavailable',
        'Turbo 不可用通常是 codegen 或 target 集成问题，不是业务逻辑问题。',
        '先查 codegen 产物、编译目标、清缓存重编译，再看接口签名是否一致。',
      );
      return;
    }

    const syncStart = Date.now();
    const uptime = faceGlowTurboService.getDeviceUptimeMsSync();
    const echo = faceGlowTurboService.echoSync('hello-turbo');
    const syncCost = Date.now() - syncStart;

    const asyncStart = Date.now();
    const nativeLoop = await faceGlowTurboService.measureLoopAsync(1500000);
    const e2e = Date.now() - asyncStart;

    appendInsight(
      '实验8: TurboModule 混合同步/异步',
      `syncCost=${syncCost}ms, uptime=${uptime}, echo=${echo}, nativeLoop=${nativeLoop}ms, e2e=${e2e}ms`,
      'Native 侧最优实践是同步接口只做轻快查询，重任务走异步，不阻塞 JS 与主线程。',
      '按 API 语义分层：同步查询状态、异步执行任务，配合 codegen 保证跨端契约稳定。',
    );
  }, [appendInsight]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    console.log('[RNNativeLab] clear logs');
  }, []);

  const renderExperimentAction = (key: ExperimentKey, title: string, onPressRun: () => void) => (
    <View style={styles.experimentRow}>
      <TouchableOpacity style={[styles.button, styles.runButton]} onPress={onPressRun}>
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.copyButton} onPress={() => copyOneLiner(key)}>
        <Text style={styles.copyButtonText}>复制一句话答案</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>RN Native 通信实验场</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          目标：用 Native 视角回答面试题。每次实验都给出指标、原因和优化动作，并支持复制一句话标准答案。
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>运行时快照（Native 侧能力）</Text>
          <Text style={styles.cardDesc}>
            Hermes={runtimeInfo.isHermes ? 'Yes' : 'No'} / TurboProxy=
            {runtimeInfo.hasTurboModuleProxy ? 'Yes' : 'No'} / Bridgeless=
            {runtimeInfo.isBridgeless ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.cardDesc}>
            NativeModules={runtimeInfo.nativeModuleCount} / Platform={Platform.OS.toUpperCase()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>实验参数</Text>
          <Text style={styles.cardDesc}>payload items: {payloadSize}</Text>
          <Text style={styles.cardDesc}>round（调用轮次）: {round}</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setPayloadSize(2000)}>
              <Text style={styles.buttonText}>payload 2k</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setPayloadSize(10000)}>
              <Text style={styles.buttonText}>payload 10k</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setPayloadSize(30000)}>
              <Text style={styles.buttonText}>payload 30k</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setRound(100)}>
              <Text style={styles.buttonText}>round 100</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setRound(500)}>
              <Text style={styles.buttonText}>round 500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={() => setRound(1000)}>
              <Text style={styles.buttonText}>round 1000</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>面试题 1：新架构如何优化通信效率？</Text>
          {renderExperimentAction('exp1', '实验1：初始化更新的数据规模与耗时', runInitPayloadExperiment)}
          {renderExperimentAction('exp2', '实验2：旧桥接 vs Turbo 调用耗时', runBridgeVsTurboExperiment)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>面试题 2：大数据更新怎么降成本？</Text>
          {renderExperimentAction('exp3', '实验3：大包一次 vs 分片策略', runPayloadStrategyExperiment)}
          {renderExperimentAction('exp4', '实验4：交互后通信（调度时机）', runSchedulingExperiment)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>面试题 3：如何证明你懂 Turbo/JSI？</Text>
          {renderExperimentAction('exp5', '实验5：序列化成本放大观察', runBridgePayloadExperiment)}
          {renderExperimentAction('exp6', '实验6：Native 异步调用测时', runNativeModuleAsyncExperiment)}
          {renderExperimentAction('exp7', '实验7：JSI 同步读写能力', runSyncJSIExperiment)}
          {renderExperimentAction('exp8', '实验8：TurboModule 同步/异步调用', runTurboModuleExperiment)}
        </View>

        <View style={styles.card}>
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>实验日志（最新在上）</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.clearText}>清空</Text>
            </TouchableOpacity>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>暂无日志，先点击实验按钮</Text>
          ) : (
            logs.map(item => (
              <View key={item.id} style={styles.logItem}>
                <Text style={styles.logTitle}>• {item.title}</Text>
                <Text style={styles.logLine}>指标: {item.metrics}</Text>
                <Text style={styles.logLine}>解读: {item.interpretation}</Text>
                <Text style={styles.logLine}>思路: {item.idea}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#F5F5F5',
    fontSize: 17,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    gap: 14,
  },
  intro: {
    color: '#C7C7C7',
    lineHeight: 20,
    fontSize: 13,
  },
  card: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    color: '#BEBEBE',
    fontSize: 12,
    lineHeight: 18,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2D64FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  experimentRow: {
    gap: 8,
  },
  runButton: {
    width: '100%',
  },
  copyButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5B82FF',
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(45, 100, 255, 0.15)',
  },
  copyButtonText: {
    color: '#AECBFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: '#7EA3FF',
    fontSize: 12,
  },
  emptyText: {
    color: '#9A9A9A',
    fontSize: 12,
  },
  logLine: {
    color: '#D0D0D0',
    fontSize: 12,
    lineHeight: 18,
  },
  logTitle: {
    color: '#F2F2F2',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 8,
    marginBottom: 4,
  },
});

export default RNRenderLabScreen;
