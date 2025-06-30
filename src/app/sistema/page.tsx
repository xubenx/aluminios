"use client";
import React, { useState, useEffect } from "react";
import {
  loadDashboardData,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  type Stats
} from "./dashboardController";

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    duplicates: false,
    quality: false,
    performance: false,
    predictions: false
  });

  // Estado para secciones expandibles
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    handleLoadData();
  }, []);

  const handleLoadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const analyzedStats = await loadDashboardData();
      setStats(analyzedStats);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              margin: '0 auto 20px', 
              border: '5px solid #f3f3f3', 
              borderTop: '5px solid #3498db', 
              borderRadius: '50%', 
              animation: 'spin 2s linear infinite' 
            }}></div>
            <h2 style={{ color: '#666' }}>Analizando sistema...</h2>
            <p style={{ color: '#888' }}>Cargando métricas, duplicados y predicciones</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Pantalla de error
  if (error || !stats) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ef5350', 
          borderRadius: '4px', 
          color: '#c62828', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>{error || "Error al cargar los datos"}</div>
          <button 
            onClick={handleLoadData} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#c62828', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            fontSize: '2.2rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            📊 Dashboard Ejecutivo
          </h1>
          <p style={{ color: '#666', margin: '5px 0 0' }}>
            Análisis completo del sistema Aluminios San Francisco
          </p>
        </div>
        <button 
          onClick={handleLoadData}
          disabled={loading}
          style={{ 
            padding: '8px 15px', 
            backgroundColor: 'transparent',
            border: '1px solid #1976d2',
            borderRadius: '4px',
            color: '#1976d2',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Métricas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>{stats.totalProjects}</h2>
              <p style={{ margin: '5px 0 0' }}>Proyectos Activos</p>
            </div>
            <div style={{ opacity: 0.8, fontSize: '2.5rem' }}>📋</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>{formatCurrency(stats.projectsValue.total)}</h2>
              <p style={{ margin: '5px 0 0' }}>Valor Total Proyectos</p>
            </div>
            <div style={{ opacity: 0.8, fontSize: '2.5rem' }}>💰</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>{formatCurrency(stats.financialSummary.balance)}</h2>
              <p style={{ margin: '5px 0 0' }}>Balance Financiero</p>
            </div>
            <div style={{ opacity: 0.8, fontSize: '2.5rem' }}>🏦</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>{stats.dataQuality.completenessScore}%</h2>
              <p style={{ margin: '5px 0 0' }}>Calidad de Datos</p>
            </div>
            <div style={{ opacity: 0.8, fontSize: '2.5rem' }}>📊</div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero Detallado */}
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', marginTop: 0, display: 'flex', alignItems: 'center' }}>
          💰 Resumen Financiero Detallado
        </h2>
        
        {/* Métricas principales de ingresos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#2e7d32', marginBottom: '5px' }}>💵 Total Ingresos</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1b5e20' }}>
              {formatCurrency(stats.financialSummary.totalIncome)}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#c62828', marginBottom: '5px' }}>💸 Total Gastos</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#b71c1c' }}>
              {formatCurrency(stats.financialSummary.totalExpenses)}
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '15px', 
            backgroundColor: stats.financialSummary.balance >= 0 ? '#e3f2fd' : '#fff3e0', 
            borderRadius: '8px' 
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: stats.financialSummary.balance >= 0 ? '#1565c0' : '#ef6c00', 
              marginBottom: '5px' 
            }}>
              🏦 Balance Neto
            </div>
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: 'bold', 
              color: stats.financialSummary.balance >= 0 ? '#0d47a1' : '#e65100' 
            }}>
              {formatCurrency(stats.financialSummary.balance)}
            </div>
          </div>
        </div>

        {/* Desglose de ingresos */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '15px', color: '#495057' }}>
            📋 Desglose de Ingresos
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6c757d' }}>📝 Diario Contable:</span>
              <strong style={{ color: '#28a745' }}>
                {formatCurrency(stats.financialSummary.journalIncome)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6c757d' }}>🏗️ Pagos de Proyectos:</span>
              <strong style={{ color: '#17a2b8' }}>
                {formatCurrency(stats.financialSummary.projectPaymentsIncome)}
              </strong>
            </div>
          </div>
          
          {/* Porcentajes */}
          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#6c757d' }}>
            <div>
              • Diario: {stats.financialSummary.totalIncome > 0 ? 
                Math.round((stats.financialSummary.journalIncome / stats.financialSummary.totalIncome) * 100) : 0}%
            </div>
            <div>
              • Proyectos: {stats.financialSummary.totalIncome > 0 ? 
                Math.round((stats.financialSummary.projectPaymentsIncome / stats.financialSummary.totalIncome) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de inventario */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>📦 Resumen de Inventario</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ textAlign: 'center', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#1976d2', margin: '0' }}>{stats.totalMaterials}</h3>
              <p style={{ margin: '5px 0 0' }}>Materiales</p>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#1976d2', margin: '0' }}>{stats.totalChapes}</h3>
              <p style={{ margin: '5px 0 0' }}>Herrajes</p>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#1976d2', margin: '0' }}>{stats.totalGlasses}</h3>
              <p style={{ margin: '5px 0 0' }}>Vidrios</p>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#1976d2', margin: '0' }}>{stats.totalModels}</h3>
              <p style={{ margin: '5px 0 0' }}>Modelos</p>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>🥧 Estado de Proyectos</h2>
          <div style={{ marginTop: '15px' }}>
            {Object.entries(stats.projectsStatus).map(([status, count]) => {
              const total = stats.totalProjects;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const statusLabels: { [key: string]: { label: string; color: string } } = {
                quotation: { label: 'Cotizaciones', color: '#ff9800' },
                active: { label: 'Activos', color: '#4caf50' },
                completed: { label: 'Completados', color: '#2196f3' },
                cancelled: { label: 'Cancelados', color: '#f44336' },
                inactive: { label: 'Inactivos', color: '#9e9e9e' }
              };
              
              return (
                <div key={status} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{statusLabels[status]?.label}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: statusLabels[status]?.color,
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secciones expandibles */}
      
      {/* Análisis de Duplicados */}
      <div style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <div 
          onClick={() => toggleSection('duplicates')}
          style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderBottom: expandedSections.duplicates ? '1px solid #e0e0e0' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#f44336' }}>⚠️</span>
            Análisis de Duplicados
            {(stats.duplicates.materials.length + stats.duplicates.chapes.length + 
              stats.duplicates.glasses.length + stats.duplicates.customers.length) > 0 && (
              <span style={{ 
                marginLeft: '10px',
                backgroundColor: '#ff9800', 
                color: 'white', 
                borderRadius: '12px', 
                padding: '2px 8px', 
                fontSize: '0.8rem' 
              }}>
                {stats.duplicates.materials.length + stats.duplicates.chapes.length + 
                 stats.duplicates.glasses.length + stats.duplicates.customers.length}
              </span>
            )}
          </h2>
          <span>{expandedSections.duplicates ? '▼' : '▶'}</span>
        </div>
        {expandedSections.duplicates && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '15px' }}>
              {Object.entries(stats.duplicates).map(([category, duplicates]) => (
                <div key={category} style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '15px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  {duplicates.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#4caf50' }}>
                      <span style={{ marginRight: '8px' }}>✅</span>
                      <span>No se encontraron duplicados</span>
                    </div>
                  ) : (
                    <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
                      {duplicates.slice(0, 5).map((dup: any, index: number) => (
                        <li key={index} style={{ marginBottom: '8px' }}>
                          <strong>{dup.name}</strong> ({dup.count} veces)
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            IDs: {dup.ids.join(", ")}
                          </div>
                        </li>
                      ))}
                      {duplicates.length > 5 && (
                        <li style={{ color: '#666', fontStyle: 'italic' }}>
                          ...y {duplicates.length - 5} más
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Rendimiento y Análisis */}
      <div style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <div 
          onClick={() => toggleSection('performance')}
          style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderBottom: expandedSections.performance ? '1px solid #e0e0e0' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#4caf50' }}>🚀</span>
            Rendimiento y Análisis
          </h2>
          <span>{expandedSections.performance ? '▼' : '▶'}</span>
        </div>
        {expandedSections.performance && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '15px' }}>
                <h3 style={{ fontSize: '1.1rem', marginTop: 0 }}>
                  <span style={{ marginRight: '8px' }}>👥</span>
                  Top Clientes
                </h3>
                <ul style={{ padding: 0, listStyleType: 'none' }}>
                  {stats.performance.topCustomers.map((customer, index) => (
                    <li key={index} style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: '#1976d2', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '12px', 
                        marginRight: '10px' 
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'medium' }}>{customer.name}</div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {customer.projectCount} proyectos - {formatCurrency(customer.totalValue)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
      
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '15px' }}>
                <h3 style={{ fontSize: '1.1rem', marginTop: 0 }}>
                  <span style={{ marginRight: '8px' }}>📈</span>
                  Actividad Reciente
                </h3>
                <ul style={{ padding: 0, listStyleType: 'none' }}>
                  {stats.performance.recentActivity.map((activity, index) => (
                    <li key={index} style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        marginRight: '10px',
                        color: activity.type === "Proyecto" ? '#1976d2' : '#4caf50'
                      }}>
                        {activity.type === "Proyecto" ? '📋' : '💰'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'medium' }}>{activity.description}</div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {activity.type} - {formatDate(activity.date)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Predicciones y Recomendaciones */}
      <div style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <div 
          onClick={() => toggleSection('predictions')}
          style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderBottom: expandedSections.predictions ? '1px solid #e0e0e0' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#2196f3' }}>💡</span>
            Predicciones y Recomendaciones
          </h2>
          <span>{expandedSections.predictions ? '▼' : '▶'}</span>
        </div>
        {expandedSections.predictions && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{formatCurrency(stats.predictions.expectedRevenue)}</h3>
                <p style={{ margin: '5px 0 0' }}>Ingresos Esperados</p>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0' }}>Proyectos activos + 30% cotizaciones</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: stats.predictions.growthRate >= 0 ? '#e8f5e8' : '#ffebee', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>
                  {stats.predictions.growthRate >= 0 ? '+' : ''}{stats.predictions.growthRate.toFixed(1)}%
                </h3>
                <p style={{ margin: '5px 0 0' }}>Crecimiento Mensual</p>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0' }}>Comparado con mes anterior</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{formatCurrency(stats.financialSummary.averageProjectValue)}</h3>
                <p style={{ margin: '5px 0 0' }}>Valor Promedio</p>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0' }}>Por proyecto completado</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{stats.predictions.recommendations.length}</h3>
                <p style={{ margin: '5px 0 0' }}>Recomendaciones</p>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0' }}>Acciones sugeridas</p>
              </div>
            </div>
            
            {stats.predictions.recommendations.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px', color: '#ff9800' }}>⚠️</span>
                  Recomendaciones del Sistema
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.predictions.recommendations.map((rec, index) => (
                    <div key={index} style={{ 
                      padding: '10px', 
                      backgroundColor: '#e3f2fd', 
                      borderLeft: '4px solid #2196f3', 
                      borderRadius: '4px' 
                    }}>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resumen Financiero Final */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#4caf50', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📈</div>
          <h3 style={{ margin: '0' }}>Ingresos</h3>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0 0' }}>{formatCurrency(stats.financialSummary.totalIncome)}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f44336', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📉</div>
          <h3 style={{ margin: '0' }}>Gastos</h3>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0 0' }}>{formatCurrency(stats.financialSummary.totalExpenses)}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: stats.financialSummary.balance >= 0 ? '#1976d2' : '#ff9800', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💰</div>
          <h3 style={{ margin: '0' }}>Balance</h3>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0 0' }}>{formatCurrency(stats.financialSummary.balance)}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#2196f3', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗂️</div>
          <h3 style={{ margin: '0' }}>Registros</h3>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0 0' }}>{stats.totalJournalEntries}</h2>
        </div>
      </div>
    </div>
  );
}
