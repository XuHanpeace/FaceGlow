import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { closeNativeScreen } from '../navigation/nativeNavigationUtils';

interface Movie {
  id: string;
  title: string;
  releaseYear: string;
}

type DetailScreenProps = {
  route: {
    params: {
      id: string;
      title: string;
      content: string;
    };
  };
};

const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { title, content } = route.params;
  const isDarkMode = useColorScheme() === 'dark';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    try {
      setLoading(true);
      let response = await fetch('https://facebook.github.io/react-native/movies.json');
      let responseJson = await response.json();
      setMovies(responseJson.movies);
      setError(null);
    } catch (e) {
      setError('获取电影数据失败');
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    closeNativeScreen();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: isDarkMode ? '#ff4d4f' : '#f5222d' }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        <Text style={[styles.contentText, { color: isDarkMode ? '#ccc' : '#333' }]}>{content}</Text>

        <View style={styles.moviesContainer}>
          <Text style={[styles.moviesTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            电影列表
          </Text>
          {movies.map(movie => (
            <View
              key={movie.id}
              style={[styles.movieItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={[styles.movieTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                {movie.title}
              </Text>
              <Text style={[styles.movieYear, { color: isDarkMode ? '#ccc' : '#666' }]}>
                ({movie.releaseYear})
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>{title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={[styles.closeButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>
            关闭
          </Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  moviesContainer: {
    marginTop: 20,
  },
  moviesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  movieYear: {
    fontSize: 14,
  },
});

export default DetailScreen;
