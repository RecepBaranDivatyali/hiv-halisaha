import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gizlilik Politikası</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>H.İ.V Halısaha Gizlilik Politikası</Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>Son Güncelleme: 1 Ekim 2026</Text>

        <Text style={[styles.paragraph, { color: theme.text }]}>
          H.İ.V Halısaha ("Halısahaya İhtiyacım Var"), kullanıcılarının gizliliğine ve kişisel verilerinin korunmasına büyük önem vermektedir. Bu Gizlilik Politikası, uygulamamızı kullandığınızda toplanan, işlenen ve korunan verilere ilişkin hak ve yükümlülüklerinizi açıklar.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Toplanan Bilgiler</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Uygulamamızın temel halısaha eşleşme, kadro kurma ve sosyal özelliklerini sunabilmek amacıyla aşağıdaki veriler toplanabilir:
        </Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• <Text style={{ fontWeight: 'bold' }}>Hesap ve Profil Bilgileri:</Text> Ad-soyad, e-posta adresi, profil fotoğrafı, futbol mevkisi, tercih edilen ayak, şehir ve ilçe.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• <Text style={{ fontWeight: 'bold' }}>Maç ve Takım Bilgileri:</Text> Katıldığınız veya oluşturduğunuz maçlar, takım dizilişleri, maç skorları ve oyuncu değerlendirme puanları.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• <Text style={{ fontWeight: 'bold' }}>İletişim & Sohbet:</Text> Maç odası içi mesajlar ve kulüp bildirimleri.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• <Text style={{ fontWeight: 'bold' }}>Cihaz ve Kullanım Verileri:</Text> Hata raporları ve uygulama performansı (Google Firebase altyapısı üzerinden anonimleştirilmiş olarak).</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Bilgilerin Kullanım Amacı</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• Halısaha maçları oluşturmak, eksik oyuncu bulmak ve kadro dizilişlerini yönetmek.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• Kulüpler arası meydan okuma ve liderlik tablosunu hesaplamak.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• Maç ücreti bölüşümü ve ödeme durumlarını takım kaptanına iletmek.</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>• Kullanıcı güvenilirliğini artırmak ve maç katılım istatistiklerini hesaplamak.</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Üçüncü Taraf Hizmetleri</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Verileriniz, güvenli bulut depolama ve kimlik doğrulama amacıyla Google Cloud / Firebase altyapısında barındırılır. Verileriniz hiçbir şekilde üçüncü taraflara ticari veya reklam amacıyla satılmaz.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Hesap ve Veri Silme Talebi</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Kullanıcılar diledikleri zaman hesaplarını ve ilişkili tüm kişisel verilerini silebilirler. Hesabınızı uygulama içinden "Ayarlar → Hesabımı Sil" adımıyla veya bize doğrudan e-posta göndererek kalıcı olarak sildirebilirsiniz.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. İletişim</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Gizlilik politikamız veya kişisel verilerinizle ilgili her türlü soru ve talebiniz için bizimle iletişime geçebilirsiniz:
        </Text>
        <Text style={[styles.bullet, { color: theme.primary, fontWeight: 'bold' }]}>E-posta: barandivatyali@gmail.com</Text>
        <Text style={[styles.bullet, { color: theme.text }]}>Geliştirici: Recep Baran Divatyalı</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.headlineBold,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.headlineBold,
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.headlineBold,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
});
