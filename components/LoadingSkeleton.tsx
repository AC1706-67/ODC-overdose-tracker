import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoadingSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton} />
      
      {/* Metrics Grid Skeleton */}
      <View style={styles.metricsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.metricCardSkeleton}>
            <View style={styles.metricIconSkeleton} />
            <View style={styles.metricValueSkeleton} />
            <View style={styles.metricSubtextSkeleton} />
          </View>
        ))}
      </View>
      
      {/* Chart Skeletons */}
      <View style={styles.chartSkeleton} />
      <View style={styles.chartSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerSkeleton: {
    height: 60,
    backgroundColor: '#e5e7eb',
    margin: 20,
    borderRadius: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  metricCardSkeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    height: 120,
  },
  metricIconSkeleton: {
    width: 24,
    height: 24,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
    marginBottom: 8,
  },
  metricValueSkeleton: {
    width: '60%',
    height: 32,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
    marginBottom: 8,
  },
  metricSubtextSkeleton: {
    width: '80%',
    height: 16,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
  },
  chartSkeleton: {
    height: 200,
    backgroundColor: '#e5e7eb',
    margin: 20,
    borderRadius: 12,
  },
});