// Quick Test Script - Browser Console'da çalıştır
// Ana uygulama sayfasında (http://127.0.0.1:52406) kullanın

console.log('🧪 Quick Test - Eksik Fonksiyonlar Kontrolü');

function quickTestMissingFunctions() {
    const results = [];

    // filterActions testi
    if (typeof window.filterActions === 'function') {
        try {
            const filtered = filterActions();
            results.push('✅ filterActions fonksiyonu çalışıyor');
            console.log('✅ filterActions:', Array.isArray(filtered) ? `${filtered.length} sonuç` : 'çalışır');
        } catch (error) {
            results.push('❌ filterActions hatası: ' + error.message);
        }
    } else {
        results.push('❌ filterActions fonksiyonu bulunamadı');
    }

    // searchActions testi
    if (typeof window.searchActions === 'function') {
        try {
            const searched = searchActions('test');
            results.push('✅ searchActions fonksiyonu çalışıyor');
            console.log('✅ searchActions:', Array.isArray(searched) ? `${searched.length} sonuç` : 'çalışır');
        } catch (error) {
            results.push('❌ searchActions hatası: ' + error.message);
        }
    } else {
        results.push('❌ searchActions fonksiyonu bulunamadı');
    }

    // Test sonuçlarını göster
    console.log('\n🎯 Quick Test Sonuçları:');
    results.forEach(result => console.log(result));

    const passed = results.filter(r => r.includes('✅')).length;
    const total = results.length;

    console.log(`\n📊 Sonuç: ${passed}/${total} (%${((passed/total)*100).toFixed(1)})`);

    return { passed, total, results };
}

// Test'i çalıştır
const testResult = quickTestMissingFunctions();

// Eğer tam test yapmak isterseniz:
console.log('\n🔬 Tam test için:');
console.log('fetch("./automated-tester.js").then(r=>r.text()).then(eval); runAutomatedTests();');