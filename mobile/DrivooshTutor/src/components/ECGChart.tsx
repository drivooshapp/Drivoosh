import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = 24;
const CARD_PADDING = 16;
const MIN_CHART_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2) - (CARD_PADDING * 2);
const CHART_HEIGHT = 130;
const COLUMN_WIDTH = 85;

interface ECGChartProps {
  data: { label: string; count: number }[];
}

const ECGChart = ({ data }: ECGChartProps) => {
  const strokeDashoffset = useRef(new Animated.Value(800)).current;
  const [totalLength, setTotalLength] = useState(800);
  const [offsetVal, setOffsetVal] = useState(800);

  useEffect(() => {
    const listenerId = strokeDashoffset.addListener(({ value }) => {
      setOffsetVal(value);
    });
    return () => {
      strokeDashoffset.removeListener(listenerId);
    };
  }, [strokeDashoffset]);

  let chartData = [...data];
  if (chartData.length === 0) {
    chartData = [{ label: "אין נתונים", count: 0 }];
  }

  const X_OFFSET = 25;
  const calculatedWidth = Math.max(MIN_CHART_WIDTH, chartData.length * COLUMN_WIDTH);
  const maxCount = Math.max(...chartData.map(d => d.count), 2);

  const usableWidth = calculatedWidth - (X_OFFSET * 2);
  const stepX = chartData.length > 1 ? usableWidth / (chartData.length - 1) : usableWidth;

  const generatePoints = () => {
    if (chartData.length === 1) {
      const d = chartData[0];
      const paddingY = 20;
      const usableHeight = CHART_HEIGHT - paddingY * 2;
      const y = CHART_HEIGHT - paddingY - ((d.count / maxCount) * usableHeight);

      const centerX = calculatedWidth / 2;
      const startX = X_OFFSET;
      const endX = calculatedWidth - X_OFFSET;

      const pathD = `M ${startX} ${y} L ${endX} ${y}`;
      const closedPathD = `M ${startX} ${CHART_HEIGHT} L ${startX} ${y} L ${endX} ${y} L ${endX} ${CHART_HEIGHT} Z`;

      const points = [{ x: centerX, y, label: d.label, count: d.count }];

      return { pathD, closedPathD, points };
    }

    const points = chartData.map((d, index) => {
      const x = X_OFFSET + (index * stepX);
      const paddingY = 20;
      const usableHeight = CHART_HEIGHT - paddingY * 2;
      const y = CHART_HEIGHT - paddingY - ((d.count / maxCount) * usableHeight);
      return { x, y, label: d.label, count: d.count };
    });

    let pathD = "";
    let closedPathD = "";

    points.forEach((p, idx) => {
      if (idx === 0) {
        pathD += `M ${p.x} ${p.y}`;
        closedPathD += `M ${p.x} ${CHART_HEIGHT} L ${p.x} ${p.y}`;
      } else {
        const prev = points[idx - 1];
        const cpX1 = prev.x + stepX / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + stepX / 2;
        const cpY2 = p.y;

        const curveSegment = ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
        pathD += curveSegment;
        closedPathD += curveSegment;
      }

      if (idx === points.length - 1) {
        closedPathD += ` L ${p.x} ${CHART_HEIGHT} Z`;
      }
    });

    return { pathD, closedPathD, points };
  };

  const { pathD, closedPathD, points } = generatePoints();

  useEffect(() => {
    strokeDashoffset.setValue(totalLength);
    Animated.timing(strokeDashoffset, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [pathD, totalLength]);

  return (
    <View style={styles.chartWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ minWidth: '100%' }}
        contentOffset={{ x: Math.max(0, calculatedWidth - MIN_CHART_WIDTH), y: 0 }}
      >
        <View style={{ width: calculatedWidth, height: CHART_HEIGHT + 55 }}>
          <View style={{ width: calculatedWidth, height: CHART_HEIGHT, justifyContent: 'center' }}>
            <Svg width={calculatedWidth} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
                  <Stop offset="50%" stopColor="#00C2E8" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#008EA6" stopOpacity="0.9" />
                </LinearGradient>

                <LinearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#00C2E8" stopOpacity="0.22" />
                  <Stop offset="100%" stopColor="#00C2E8" stopOpacity="0.00" />
                </LinearGradient>
              </Defs>

              <Line x1={X_OFFSET} y1={CHART_HEIGHT * 0.25} x2={calculatedWidth - X_OFFSET} y2={CHART_HEIGHT * 0.25} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1={X_OFFSET} y1={CHART_HEIGHT * 0.5} x2={calculatedWidth - X_OFFSET} y2={CHART_HEIGHT * 0.5} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1={X_OFFSET} y1={CHART_HEIGHT * 0.75} x2={calculatedWidth - X_OFFSET} y2={CHART_HEIGHT * 0.75} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

              {closedPathD ? (
                <Path d={closedPathD} fill="url(#chartAreaGrad)" />
              ) : null}

              <Path
                d={pathD}
                fill="none"
                stroke="url(#ecgGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${totalLength} ${totalLength}`}
                strokeDashoffset={offsetVal}
                onLayout={(e) => {
                  const length = e.nativeEvent.layout.width * 2;
                  setTotalLength(length || 800);
                }}
              />

              {points.map((p, idx) => {
                if (p.count === 0) return null;
                return (
                  <React.Fragment key={idx}>
                    <Circle cx={p.x} cy={p.y} r="8" fill="#00C2E8" fillOpacity="0.15" />
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#fff"
                      stroke="#00C2E8"
                      strokeWidth="3"
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          <View style={[styles.labelsRow, { width: calculatedWidth }]}>
            {points.map((p, idx) => (
              <View
                key={idx}
                style={[
                  styles.labelCol,
                  {
                    position: 'absolute',
                    left: p.x - 40,
                    width: 80
                  }
                ]}
              >
                {p.count > 0 && (
                  <View style={styles.chartBubbleContainer}>
                    <Text style={styles.chartBubbleText}>{p.count}</Text>
                  </View>
                )}
                <Text style={styles.chartLabelText}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ECGChart;

const styles = StyleSheet.create({
  chartWrapper: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#ebeff300', marginVertical: 12, width: '100%' },
  labelsRow: { height: 38, marginTop: 8, position: 'relative' },
  labelCol: { alignItems: 'center' },
  chartBubbleContainer: { shadowColor: '#00C2E8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 1 },
  chartBubbleText: { fontSize: 10, fontWeight: '800', color: '#00C2E8', marginBottom: 4, backgroundColor: '#e0fcfd', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', textAlign: 'center' },
  chartLabelText: { fontSize: 10, fontWeight: '700', color: '#64748b', textAlign: 'center' },
});