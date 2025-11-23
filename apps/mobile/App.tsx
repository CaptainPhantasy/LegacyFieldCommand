import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { database } from './db';
import { sync } from './db/sync';
import withObservables from '@nozbe/with-observables';
import Job from './db/model/Job';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import LoginScreen from './screens/LoginScreen';
import JobDetailScreen from './screens/jobs/JobDetailScreen';
import ArrivalGateScreen from './screens/gates/ArrivalGateScreen';
import PhotosGateScreen from './screens/gates/PhotosGateScreen';
import { colors, spacing, typography, radii } from './design/tokens';

const Stack = createNativeStackNavigator();

// Component to render single job
const JobItem = ({ job, navigation }: { job: Job; navigation: any }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{job.title}</Text>
    <Text>{job.status}</Text>
    <Button
      title="View Details"
      onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
    />
  </View>
);

// Component to render list
const JobList = ({ jobs, navigation }: { jobs: Job[]; navigation: any }) => (
  <FlatList
    data={jobs}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <JobItem job={item} navigation={navigation} />}
  />
);

// Enhance with observables
const EnhancedJobList = withObservables([], () => ({
  jobs: database.collections.get<Job>('jobs').query(),
}))(JobList);

function DashboardScreen({ navigation }: any) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await sync();
      // TODO: replace with a non-blocking in-app toast
      alert('Sync complete!');
    } catch (e: any) {
      alert('Sync failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Jobs</Text>
        <View style={styles.headerActions}>
          <Button title={syncing ? "Syncing..." : "Sync Now"} onPress={handleSync} disabled={syncing} />
          <View style={{width: 10}} />
          <Button title="Sign Out" onPress={handleSignOut} color="red" />
        </View>
      </View>
      <EnhancedJobList navigation={navigation} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: 'Legacy Field Command' }}
        />
        <Stack.Screen 
          name="JobDetail" 
          component={JobDetailScreen}
          options={{ title: 'Job Details' }}
        />
        <Stack.Screen 
          name="ArrivalGate" 
          component={ArrivalGateScreen}
          options={{ title: 'Arrival Gate' }}
        />
        <Stack.Screen 
          name="PhotosGate" 
          component={PhotosGateScreen}
          options={{ title: 'Photos Gate' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
  },
  header: {
    width: '100%',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  headerText: {
    fontSize: typography.title,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  item: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    width: '100%',
    minWidth: 300,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
});
