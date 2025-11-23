import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Job from '../../db/model/Job';
import JobGate from '../../db/model/JobGate';
import { database } from '../../db';
import { Q } from '@nozbe/watermelondb';

interface JobDetailScreenProps {
  route: {
    params: {
      jobId: string;
    };
  };
}

export default function JobDetailScreen({ route }: JobDetailScreenProps) {
  const navigation = useNavigation();
  const { jobId } = route.params;
  const [job, setJob] = React.useState<Job | null>(null);
  const [gates, setGates] = React.useState<JobGate[]>([]);

  React.useEffect(() => {
    const fetchJob = async () => {
      const jobCollection = database.collections.get<Job>('jobs');
      const foundJob = await jobCollection.find(jobId);
      setJob(foundJob);

      // Fetch gates for this job
      const gatesCollection = database.collections.get<JobGate>('job_gates');
      const jobGates = await gatesCollection
        .query(Q.where('job_id', jobId))
        .fetch();
      setGates(jobGates);
    };

    fetchJob();
  }, [jobId]);

  const getGateStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'in_progress':
        return '→';
      case 'skipped':
        return '⚠';
      default:
        return '○';
    }
  };

  const getGateStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return '#10b981'; // green
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'skipped':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const gateOrder = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'];

  const orderedGates = gateOrder.map(stageName => 
    gates.find(g => g.stageName === stageName)
  ).filter(Boolean) as JobGate[];

  if (!job) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.address}>{job.addressLine1 || 'No address'}</Text>
        <Text style={styles.status}>Status: {job.status}</Text>
      </View>

      <View style={styles.gatesContainer}>
        <Text style={styles.sectionTitle}>Visit Workflow</Text>
        {orderedGates.map((gate) => (
          <TouchableOpacity
            key={gate.id}
            style={[
              styles.gateCard,
              gate.status === 'complete' && styles.gateCardComplete,
              gate.status === 'in_progress' && styles.gateCardInProgress,
            ]}
            onPress={() => {
              const screenName = gate.stageName === 'Arrival' ? 'ArrivalGate' : 
                                 gate.stageName === 'Photos' ? 'PhotosGate' : 
                                 'ArrivalGate'; // Default fallback
              navigation.navigate(screenName as never, { gateId: gate.id, jobId } as never);
            }}
          >
            <View style={styles.gateHeader}>
              <Text style={styles.gateIcon}>{getGateStatusIcon(gate.status)}</Text>
              <View style={styles.gateInfo}>
                <Text style={styles.gateName}>{gate.stageName}</Text>
                <Text style={[styles.gateStatus, { color: getGateStatusColor(gate.status) }]}>
                  {gate.status}
                </Text>
              </View>
            </View>
            {gate.requiresException && (
              <View style={styles.exceptionBadge}>
                <Text style={styles.exceptionText}>Exception: {gate.exceptionReason}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
  },
  gatesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  gateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gateCardComplete: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  gateCardInProgress: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  gateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  gateInfo: {
    flex: 1,
  },
  gateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gateStatus: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  exceptionBadge: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  exceptionText: {
    fontSize: 12,
    color: '#92400e',
  },
});
