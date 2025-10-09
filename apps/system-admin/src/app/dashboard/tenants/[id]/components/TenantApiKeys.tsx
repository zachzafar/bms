'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Key, Eye, EyeOff, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { AVAILABLE_SCOPES } from '../types';
import { TENANT_API_KEYS_QUERY_KEY } from '@/lib/api/queryKeys';

interface TenantApiKeysProps {
  tenantId: string;
}

export function TenantApiKeys({ tenantId }: TenantApiKeysProps) {
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    scopes: [] as string[]
  });

  // Fetch API keys data
  const { data: apiKeysData , isLoading: apiKeysLoading, refetch: refetchApiKeys } = authClient.systemAdmin.getTenantApiKeys.useQuery({
    queryData: { params: { tenantId } },
    queryKey: [...TENANT_API_KEYS_QUERY_KEY, tenantId]
  });

  const apiKeys = apiKeysData?.body || [];

  const createApiKeyMutation = authClient.systemAdmin.createTenantApiKey.useMutation({
    onSuccess: () => {
      toast.success('API Key generated successfully');
      refetchApiKeys();
      setShowCreateApiKeyModal(false);
      setNewApiKey({ name: '', scopes: [] });
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to generate API key');
      console.error('Create API key error:', error);
    }
  });

  const deleteApiKeyMutation = authClient.systemAdmin.deleteTenantApiKey.useMutation({
    onSuccess: () => {
      toast.success('API Key deleted successfully');
      refetchApiKeys();
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to delete API key');
      console.error('Delete API key error:', error);
    }
  });

  const handleCreateApiKey = () => {
    if (!newApiKey.name) {
      toast.error('Please enter an API key name');
      return;
    }

    if (newApiKey.scopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    createApiKeyMutation.mutate({
      params: { tenantId },
      body: {
        name: newApiKey.name,
        scopes: newApiKey.scopes
      }
    });
  };

  const handleDeleteApiKey = (apiKeyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      deleteApiKeyMutation.mutate({
        params: { tenantId, keyId: apiKeyId }
      });
    }
  };

  const toggleScope = (scope: string) => {
    setNewApiKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  if (apiKeysLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">API Key Management</h2>
        </div>
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-600 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">API Key Management</h2>
        <Dialog open={showCreateApiKeyModal} onOpenChange={setShowCreateApiKeyModal}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific scopes for this tenant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key-name" className="text-slate-300">API Key Name *</Label>
                <Input
                  id="api-key-name"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter a descriptive name for this API key"
                />
              </div>
              <div>
                <Label className="text-slate-300">Scopes</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={`scope-${scope}`}
                        checked={newApiKey.scopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                        className="border-slate-600"
                      />
                      <Label htmlFor={`scope-${scope}`} className="text-slate-300 text-sm">
                        {scope}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateApiKeyModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={createApiKeyMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createApiKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {createApiKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">API Keys ({apiKeys.length})</CardTitle>
          <CardDescription className="text-slate-400">
            Manage API keys for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-300 font-medium">Name</th>
                  <th className="text-left p-3 text-slate-300 font-medium">API Key</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Scopes</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Created</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Last Used</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="p-3 text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                          <Key className="h-4 w-4 text-white" />
                        </div>
                        <span>{apiKey.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-slate-700 px-2 py-1 rounded text-slate-300">
                          {showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {showKeys[apiKey.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {apiKey.scopes.slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            {scope}
                          </Badge>
                        ))}
                        {apiKey.scopes.length > 2 && (
                          <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            +{apiKey.scopes.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant="default"
                        className={apiKey.isActive ? 'bg-green-600' : 'bg-slate-600'}
                      >
                        {apiKey.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400 text-sm">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-slate-400 text-sm">
                      {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {apiKeys.length === 0 && (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No API keys found for this tenant</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}